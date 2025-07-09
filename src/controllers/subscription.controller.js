import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    if(!channelId){
        throw new ApiError(400, "Please Provide a Valid Channel ID")
    }

    const subscriber = await User.findById(req.user._id)
    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(400, "Channel Not Found!")
    }

    const existingSubscriptionId = await Subscription.findOne({
        subscriber: subscriber._id,
        channel: channel._id
    })

    let subscription;
    let subMessage;

    if(existingSubscriptionId){
        
        await Subscription.deleteOne(existingSubscriptionId)
        subMessage = "Channel is Unsubscribed!"

    }
    if(!existingSubscriptionId){
        subscription = await Subscription.create({
            subscriber: subscriber._id,
            channel: channel._id
        })
        subMessage = "Channel is Subscribed!"
    }


    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            subscription || {},
            subMessage
        )
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

        const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400, "Please Provide a Subcriber ID")
    }

    const subcriber = await User.findById(subscriberId)

    if(!subcriber){
        throw new ApiError(400, "Channel Not Found!")
    }

    const subcribedChannel = await Subscription.aggregate([
        {
            $match: {
                subcriber: subcriber._id
            }
        },
        {
            $project:{
                subscriber: 1,
                channel: 1
            }
        }
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            subcribedChannel,
            "Channel's Subcribers Fetched Successfully"
        )
    )
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!channelId){
        throw new ApiError(400, "Please Provide a Valid Channel ID")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(400, "Channel Not Found!")
    }

    const channelSubcribers = await Subscription.aggregate([
        {
            $match: {
                channel: channel._id
            }
        },
        {
            $project:{
                subscriber: 1,
                channel: 1
            }
        }
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            channelSubcribers,
            "User's Subcribed Channels Fetched Successfully"
        )
    )
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}