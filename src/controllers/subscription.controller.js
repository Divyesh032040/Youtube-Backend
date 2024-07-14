import mongoose, {isValidObjectId} from "mongoose"
//import {User} from "../models/User.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/User.model.js"
import { video } from "../models/Video.model.js"

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

    if(!channelId){
        throw new ApiError(400,"channel Id not provided")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channelID");
    }

    const _channelId = new mongoose.Types.ObjectId(channelId);

    //console.log(_channelId)

    const subscribers = await Subscription.aggregate([
        {
            $match: {
              channel:  new mongoose.Types.ObjectId(_channelId),
            },
          },
          // {
          //   $lookup: {
          //     from: "User",
          //     localField: "subscriber",
          //     foreignField: "_id",
          //     as: "subscribers",
              // pipeline: [
              //   {
              //     $project: {
              //       username: 1,
              //       fullName: 1,
              //       avatar: 1,
              //       createdAt: 1,
              //     },
              //   },
              // ],
           // },
          //},
        //   {
        //     $addFields: {
        //       subscribersCount: {
        //         $size: "$subscribers",
        //       },
        //       isSubscribed: {
        //         $cond: {
        //           if: { $in: [req.user?._id, "$subscribers.subscriber"] },
        //           then: true,
        //           else: false,
        //         },
        //       },
        //     },
        //   },
        // //stage 4
        // {
        //     $project: {
        //       _id: 0,
        //       subscribers: 1,
        //       subscribersCount: 1,
        //       isSubscribed: 1,
        //     },
        //   },
        ]);

    return res.status(200).json(
         new ApiResponse(200,subscribers , "Fetch subscribers details successfully")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const _subscriberId = new mongoose.Types.ObjectId(subscriberId);

        const subscribedChannel = await Subscription.aggregate([
        {
            $match:{ subscriber: _subscriberId }
        },
        { 
          $project: { channel: 1 } 
        },
        {
          $lookup:{
              from:"User",
              localField:"channel",
              foreignField:"_id",
              as:"subscribedChannel",
        },
      }
       
])

return res.status(200).json( new ApiResponse(200,subscribedChannel , "subscribed channel fetched successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}