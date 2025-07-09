import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!videoId){
        throw new ApiError(400, "Please Provide a Valid Video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    const existingLikeId = await Like.findOne({
        likedBy: req.user?._id,
        video: video._id
    })

    let like;
    let likeMessage;

    if(existingLikeId){
        
        await Like.deleteOne(existingLikeId)
        likeMessage = "Video is Unliked!"

    }
    if(!existingLikeId){
        like = await Like.create({
            likedBy: req.user?._id,
            video: video._id
        })
        likeMessage = "Video is Liked!"
    }


    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            like || {},
            likeMessage
        )
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!commentId){
        throw new ApiError(400, "Please Provide a Valid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment Not Found!")
    }

    const existingLikeId = await Like.findOne({
        likedBy: req.user?._id,
        comment: comment._id
    })

    let like;
    let likeMessage;

    if(existingLikeId){
        
        await Like.deleteOne(existingLikeId)
        likeMessage = "Comment is Unliked!"

    }
    if(!existingLikeId){
        like = await Like.create({
            likedBy: req.user?._id,
            comment: comment._id
        })
        likeMessage = "Comment is Liked!"
    }


    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            like || {},
            likeMessage
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400, "Please Provide a Valid Tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet Not Found!")
    }

    const existingLikeId = await Like.findOne({
        likedBy: req.user?._id,
        tweet: tweet._id
    })

    let like;
    let likeMessage;

    if(existingLikeId){
        
        await Like.deleteOne(existingLikeId)
        likeMessage = "Tweet is Unliked!"

    }
    if(!existingLikeId){
        like = await Like.create({
            likedBy: req.user?._id,
            tweet: tweet._id
        })
        likeMessage = "Tweet is Liked!"
    }


    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            like || {},
            likeMessage
        )
    )

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    
    if(!userId){
        throw new ApiError(400, "Please Provide a Valid Video ID")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId
            }
        },
        {
            $project:{
                video: 1,
            }
        }
    ])

    

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked Videos Fetched Successfully!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}