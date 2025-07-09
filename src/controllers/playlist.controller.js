import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "All Feilds are Required")
    }

    const newPlaylist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "Playlist Created Successfully"
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!userId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }
    
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400, "User Not Found")
    }

    const allPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: user._id
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                videos: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allPlaylists,
            "Playlists Fetched Successfully"
        )
    )
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }

    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist Fetched Successfully"
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    if(playlist.videos.includes(video._id)){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video Exists In Playlist"
            )
        )
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $push: {
                videos: video._id
            }
        },
        { new: true }
    )

    console.log(updatedPlaylist)
    console.log(updatedPlaylist.videos)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video Added In The Playlist Successfully"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    if(!playlist.videos.includes(video._id)){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video Not In Playlist"
            )
        )
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $pull: {
                videos: video._id
            }
        },
        { new: true }
    )

    console.log(updatedPlaylist)
    console.log(updatedPlaylist.videos)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video Removed From Playlist Successfully"
        )
    )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400, "Please Provide a Valid ID")
    }

    const playlist = await Playlist.findById(playlistId)

    await Playlist.deleteOne(playlist)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist Deleted Successfully"
        )
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId || !name || !description){
        throw new ApiError(400, "All Feilds Are Required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description,
            }
        }
    )

    playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist Updated Successfully"
        )
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
