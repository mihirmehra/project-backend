import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw ApiError (400, "Please Provide a Valid ID")
    }

    console.log(videoId)

    const video = await Video.findById(videoId)

    const allComments = await Comment.aggregate([
        {
            $match: {
                video: video._id
            }
        },
        {
            $project:{
                content: 1,
                video: 1,
                owner: 1,
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    console.log(allComments)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allComments,
            "Comments Fetched Successfully"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId } = req.params

    if(!content){
        throw new ApiError(400, "Commet feild is Required")
    }
    if(!videoId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }

    const newComment = await Comment.create({
        content: content,
        owner: req.user?._id,
        video: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newComment,
            "Comment Added Successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { commentId } = req.params
    
    if(!content){
        throw new ApiError(400, "Commet feild is Required")
    }
    
    if(!commentId){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment No Found")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        {
            $set: {
                content: content
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment Updated Successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    if(!commentId){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    
    if(!comment){
        throw new ApiError(400, "Comment No Found")
    }

    await Comment.deleteOne(comment)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment Deleted Successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
