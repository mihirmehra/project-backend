import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'views', sortOrder = 'ascending', userId } = req.query;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "Error User Not Found");
    }

    const matchCriteria = {
        owner: user._id
    };

    if (query) {
        matchCriteria.title = { $regex: query, $options: 'i' };
    }
    const sortDirection = (sortOrder === 'descending' || sortOrder === 'last-first') ? -1 : 1;

    const sortCriteria = (sortOrder === 'new-first') ? { createdAt: -1 } : { [sortBy]: sortDirection };

    const allVideos = await Video.aggregate([
        {
            $match: matchCriteria
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
                isPublished: 1,
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        },
        {
            $sort: sortCriteria // Use the dynamic sort criteria
        }
    ]);

    console.log(allVideos);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideos,
                "Videos Fetched Successfully!"
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user?._id

    if(!title || !description){
        throw new ApiError(400, "Title and Description Feild Are Required")
    }

    const videoLocalPath = req.files.videoFile[0]?.path
    const thumbLocalPath = req.files.thumbnail[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400, "Please Provide a Video")
    }
    if(!thumbLocalPath){
        throw new ApiError(400, "Please Provide a Thumbnail")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbLocalPath)

    if(!video){
        throw new ApiError(400, "Error While Uploading the Video to Cloudinary")
    }
    if(!thumbnail){
        throw new ApiError(400, "Error While Uploading the Thumbnail to Cloudinary")
    }

    const videoDuration = video.duration

    if(!videoDuration){
        throw new ApiError(400, "Unable to fetch video duration")
    }

    const newVideo = await Video.create({
        title: title,
        description: description,
        videoFile: video.url,
        thumbnail: thumbnail.url || "",
        owner: userId,
        duration: videoDuration,
        views: 0,
        isPublished: true,
    })

    if(!newVideo){
        throw new ApiError(400, "Unable to add the video")
    }

    const uploadedVideo = await Video.findById(newVideo._id)

    if(!uploadedVideo){
        throw new ApiError(400, "Video Not found")
    }

    return res.status(201).json(
        new ApiResponse(200,uploadedVideo, "Video Uploaded Successfully!!")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Fetched Successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if(!title || !description){
        throw new ApiError(400, "Title and Description feilds can note be Empty")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "Error While Uploading Thumbnail to cloudinary")
    }
        

    if (req.user?.thumbnail){
        await deleteFromCloudinary(req.user?.thumbnail)
    }

    const video = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnail.url,
            }
        }
    )

    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {}, "Video Updated Successfully!"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findByIdAndDelete(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video Deleted Successfully")
    )
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    video.isPublished = !video.isPublished

    const savedVideo = await video.save({validateBeforeSave: false})

    const statusMessage = savedVideo.isPublished === true ? "The video is Published" : "The video is Unpublished"

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, statusMessage)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
