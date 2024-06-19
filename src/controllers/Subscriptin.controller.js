import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { response } from "express"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw ApiError(400,"channelId invalid")
    }

    const isSubscribed = await Subscription.findOne(
        {
            subscriber:req.user?._id,
            channel:channelId
        }
    );

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed._id);

        return res.status(200).json(new ApiResponse(200, {isSubscribed:false},"unsubscribed successfully"))
    }else{
         await Subscription.create({
            subscriber:req.user?._id,
            channel:channelId
        })
        return response.status(200).json( new ApiResponse(200,{isSubscribed:true},"channel subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw ApiError(400,"invalid channelId");
    }
    const subscribersList = await Subscription.aggregate([
         {
            $match : {
                channel : "$channelId"
            }
         },
         {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            }
         }
    ])
    

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
       throw ApiError(400,"invalid subscriberId");
    }


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}