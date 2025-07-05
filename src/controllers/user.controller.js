import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    console.log(incomingRefreshToken)

    if (!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    console.log(decodedToken)

    const user = await User.findById(decodedToken?._id).select("-password")

    console.log(user)

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

})

const ChangeCurrentPassword = asyncHandler( async (req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isCorrectPassword = await user.isPasswordCorrect(oldPassword)

    if(!isCorrectPassword){
        throw new ApiError(400, 'Invalid Old Password')
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse (200, {}, 'Password Changed Successfully'))

})

const GetCurrentUser = asyncHandler( async ( req , res ) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "User Fetched Successfully")
    )
})

const UpdateAccountDetails = asyncHandler( async ( req , res ) => {

    const {fullName, email} = req.body 

    if (!fullName || !email){
        throw new ApiError(400, "All feilds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "Account Details Updated Successfully"
        )
    )

})

const UpdateUserAvatar = asyncHandler( async ( req , res ) => {
    
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is Missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error While Uploading Avatar")
    }

    await deleteFromCloudinary(req.user?.avatar.url)


    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {
                avatar: avatar.url
            }
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "Avatar Image is Updated Successfully"
        )
    )

})

const UpdateUserCoverImage = asyncHandler( async ( req , res ) => {

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is Missing")
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400, "Error While Uploading Cover Image")
    }

    await deleteFromCloudinary(req.user?.coverImage?.url)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, user, "Cover Image is Updated Successfully"
        )
    )

})

const GetUserChannelProfile = asyncHandler( async ( req, res ) => {
    
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username Not Found")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                form: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                form: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    console.log(channel);

    if(!channel?.length) {
        throw new ApiError(404, "Channel Does not Exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            channel[0], 
            "User Channel Fetched Successfully")
    )
})

const GetWatchHistory = asyncHandler( async ( req , res ) => {
    
    const userId = req.user._id

    const user = User.aggregate([
        {
            $match: {
                // _id: new mongoose.Types.ObjectId(req.user?._id)
                _id: userId
            }
        },
        {
            $lookup: {
                form: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            form: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory, 
            "Watch History Fetched Successfully"
        )
    )

} )

export { 
    RegisterUser, 
    LoginUser, 
    LogoutUser, 
    RefreshAccessToken, 
    ChangeCurrentPassword, 
    GetCurrentUser,
    UpdateAccountDetails,
    UpdateUserAvatar,
    UpdateUserCoverImage,
    GetUserChannelProfile,
    GetWatchHistory
}
