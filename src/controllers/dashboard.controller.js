import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(400, "Authentication Required")
    }

    const totalVideosViews = await Video.aggregate([
    {
        $match: {
            owner: userId,
            isPublished: true
        }
    },
    {
        $group: {
            _id: null,
            totalViews: { $sum: "$views" }
        }
    }
    ]);

    const totalViews = totalVideosViews.length > 0 ? totalVideosViews[0].totalViews : 0;

    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: userId
            }
        },
        {
            $project: {
                subcribersCount: { $size: "$subcriber" }
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: "$subcribersCount" }
            }
        }
    ])

    const totalUserSubscribers = totalSubscribers.length > 0 ? totalSubscribers[0].totalUserSubscribers : 0;

    const totalVideos = await Video.aggregate([
        {
            $match:{
                owner: userId,
                isPublished: true
            }
        },
        {
            $count: "totalVideos"
        },
    ])

    const totalUserVideos = totalVideos.length > 0 ? totalVideos[0].totalVideos : 0;

    const totalLikes= await Like.aggregate([
        {
            $match:{
                likedBy: userId,
            }
        },
        {
            $count: "totalLikes"
        },
    ])

    const totalUserLikes = totalLikes.length > 0 ? totalLikes[0].totalLikes : 0;

    const AllStatsData = {totalViews, totalUserSubscribers, totalUserVideos, totalUserLikes}

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            AllStatsData,
            "User's Stats fetched Successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(400, "Authentication Required")
    }

    const allVideos = await Video.aggregate([
        {
            $match:{
                owner: userId,
                isPublished: true
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                owner: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allVideos,
            "User's Video fetched Successfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }