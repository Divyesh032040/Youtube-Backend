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

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channelID");
    }

    channelId = new mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        //stage 1
        {
            $match: {channel : channelId}
        },
    //stage 2 : pipeline for get subscriber , subscribedToSubscriber , subscriberCount
        {
            $lookup:{
                from:"User",
                localField:"subscribers",
                foreignField:"_id",
                as:"subscribers",

                $pipeline:[
                    {
                        $lookup:{
                            from:"subscription",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribedToSubscribers"
                        }
                    },
                    {
                        $addFields : {

                            subscribedToSubscribers : {

                                $cond:{
                                    $if:{
                                        $in:[channelId,"$subscribedToSubscribers.subscriber"]
                                        },
                                        $then:true,
                                        $else:false
                                    }
                            },

                            $subscriberCount : {
                            $size : "$subscribedToSubscribers"
                            }
                        },
                    },
                ],
            },
        },
        //stage 3
        {
            $unwind:"$subscribers"
        },

        //stage 4
        {
            $project:{
                _id:0,
                subscriber:{
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
])

    return res.status(200).json(
         new ApiResponse(200,subscribers , "fetch subscribers details successfully")
    );
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