import mongoose, { isValidObjectId } from "mongoose"
import {video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/User.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params;

    if(!isValidObjectId){
        throw new ApiError(400,"invalid channel Id");
    }
    const user = await User.findById(channelId);

    if(!user){
        throw new ApiError(400,"channel Not found");
    }

    const subscribersCount = await Subscription.countDocuments({channel:channelId});

    const channelsSubscribedToCount = await Subscription.countDocuments({subscriber:channelId})

    //fetch video related stats

    const _video = await video.aggregate([
        {
            $match:{owner : channelId? new mongoose.Types.ObjectId(channelId) : null }
        },
        {
            $lookup:{
                from:"like",
                localField : "_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $group:{
                _id:null,
                totalVideos : {$sum : 1},
                totalViews : {$sum : "$views"},
                totalLikes : {$sum:{$size:"$likes"}}

            }
        },
        {
            $project: {
              _id: 0,
              totalVideos: 1,
              totalViews: 1,
              totalLikes: 1,
            },
          },
    ])
    const channelStats = {
        subscribersCount: subscribersCount || 0,
        channelsSubscribedToCount: channelsSubscribedToCount || 0,
        totalVideos: _video[0]?.totalVideos || 0,
        totalViews: _video[0]?.totalViews || 0,
        totalLikes: _video[0]?.totalLikes || 0,
      };

      return res
      .status(200)
      .json(new ApiResponse(200, channelStats, "User stats fetched successfully"));
  });




const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { channelId } = req.params;

  // Check if the provided channelId is a valid ObjectId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid ChannelId");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

     // Fetch videos from the specified channel that are published
  const _videos = await video.find({
    owner: channelId,
    isPublished: true,
  }).populate(
    "owner",
    {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      createdAt: 1,
      views: 1,
      username: 1,
      fullName: 1,
      avatar: 1,
    },
    "User"
  );

  // Check if videos were found
  if (!_videos || _videos.length === 0) {
    throw new ApiError(400, "No videos uploaded by the user");
  }

  
  return res
    .status(200)
    .json(new ApiResponse(200, _videos, "All videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }