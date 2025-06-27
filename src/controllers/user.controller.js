import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

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

    const {fullname, email, username, password} = await req.body
    console.log(req.body)
    console.log(email)

    if(
        [fullname,email,username,password].some((feild)=>feild?.trim() === "")
    ){
        throw new ApiError(400, "All feilds are required")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    console.log("existed user:",existedUser)

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log("avatar", avatarLocalPath)
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("avatar", coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("avatar", avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("avatar", coverImage)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    console.log("new user id: ",user._id)

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "something went worng while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User Regiaterd Successfully!!")
    )

})

export { RegisterUser }
