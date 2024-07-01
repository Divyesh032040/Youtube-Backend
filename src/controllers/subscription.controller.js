import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/User.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(401,"invalid channelID")
    }
    const isSubscribed = await Subscription.findOne({
        subscriber : req.user?._id,
        channel:channelId
     })

     if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res.status(200).json(
            new ApiResponse(200,{subscribed : false},"unsubscribe successfully")
        )
     }

     await Subscription.create({
        subscriber:req.user?._id,
        channel:channelId
     });

     return res.status(200).json(
        new ApiResponse(200,{ subscribed: true }, "subscribed successfully")
     );
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

   


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}