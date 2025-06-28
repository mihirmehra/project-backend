import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        let _id = userId
        const user = await User.findById({_id})
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return { accessToken , refreshToken }

    } catch (error) {
        console.log(error.message)
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const RegisterUser = asyncHandler( async (req, res) => {
    // get user details form frontend
    // verify user details - not empty
    // check if user already exists: username, email
    // check for images, avatar
    // upload them to cloudiary
    // create user object - create entry in db
    // remove password and refresh token field form response
    // check for user creation
    // return response

    const {fullName, email, username, password} = await req.body
    // console.log(req.body)
    // console.log(email)

    if(
        [fullName,email,username,password].some((feild)=>feild?.trim() === "")
    ){
        throw new ApiError(400, "All feilds are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    // console.log("existed user:",existedUser)

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log("avatar", avatarLocalPath)
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // console.log("avatar", coverImageLocalPath)

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log("avatar", avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("avatar", coverImage)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    // console.log("new user id: ",user._id)

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "something went worng while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User Regiaterd Successfully!!")
    )

})

const LoginUser = asyncHandler( async (req, res) => {
    // get user details - req.body
    // validate the data
    // check if the user exist
    // check if the password is correct
    // send access token and refresh token to the user in cookes(secure)
    // res logged in 

    console.log(req.body)

    const {username, email, password} = req.body

    if (!(username || email)){
        throw new ApiError(400, "username or email is Required")
    }

    const existingUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (!existingUser){
        throw new ApiError(400, "User does not exist")
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new ApiError(401, "Password in incorrect")
    }

    const { accessToken , refreshToken } = await generateAccessAndRefreshToken(existingUser._id)

    const LoggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {user: LoggedInUser, accessToken, refreshToken},
            "User Logged In Successfully"
        )
    )
})

const LogoutUser = asyncHandler( async ( req , res ) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out Successfully")
    )

})

const RefreshAccessToken = asyncHandler( async ( req , res ) => {

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or invalid")
        }
    
        const { accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "AccessToken is refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, "Invalid Refresh token")
    }

})

export { RegisterUser , LoginUser, LogoutUser, RefreshAccessToken }
