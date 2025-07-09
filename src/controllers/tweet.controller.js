import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(200, "User Not Found!")
    }

    console.log(req.body)

    const { content } = req.body

    if(!content){
        throw new ApiError(200, "Tweet Content Is Required")
    }

    const newTweet = await Tweet.create({
        content: content,
        owner: user._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newTweet,
            "Tweet Created Successfully"
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(200, "User Not Found!")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userTweets,
            "Tweet Fetched Successfully"
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Tweet Content Is Required")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content
            }
        }
    )

    updatedTweet.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet Updated Successfully"
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400, "Please Provide a Valid Tweet Id")
    }

    const Tweet = await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet Deleted Successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
