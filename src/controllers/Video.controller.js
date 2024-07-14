import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/User.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary,uploadOnCloudinary} from "../utils/cloudinary.js"
import {Like} from "../models/Like.model.js"
import {Comment} from "../models/Comment.model.js"
import { video } from "../models/Video.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const sortByField = ["createdAt", "duration", "views"];
    const sortTypeArr = ["asc", "dsc"];
  
    if (!sortByField.includes(sortBy) || !sortTypeArr.includes(sortType)) {
      throw new ApiError(400, "Please send valid fields for sortBy or sortType");
    }
    if (userId && !isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    const _video = video.aggregate([
      {
        $match: {
          $or: [
            {
              owner: userId ? new mongoose.Types.ObjectId(userId) : null,
            },
            {
              $and: [
                { isPublished: true },
                {
                  $or: [
                    {
                      title: query
                        ? { $regex: query, $options: "i" }
                        : { $exists: true },
                    },
                    {
                      description: query
                        ? { $regex: query, $options: "i" }
                        : null,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $sort: {
          [sortBy]: sortType === "dsc" ? -1 : 1,
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);
  
    const result = await video.aggregatePaginate(_video, {
      page,
      limit,
      customLabels: {
        totalDocs: "totalVideos",
        docs: "Videos",
      },
      allowDiskUse: true,
    });
  
    if (result.totalVideos === 0) {
      throw new ApiError(404, "Videos not found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  });


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // get video, upload to cloudinary, create video
    
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Video file not found");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail not found");
    }

    const _video = await video.create(
        {
            title,
            description,
            duration:videoFile.duration,
            videoFile:{
                url:videoFile.url,
                public_id:videoFile.public_id
            },
            thumbnail:{
                thumbnail : thumbnail.url ,
                public_id:thumbnail.public_id
            },
            owner:req.user?._id,
            isPublished:false
        }
    )

    const uploadedVideo = await video.findById(_video._id);

    if (!uploadedVideo) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res.status(200).json(
        new ApiResponse(200,_video,"video uploaded successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoID");
    }

    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400 ,"invalid userId")
    }

    const fetchedVideo = await video.aggregate([
        {
            $match: { _id : new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup:{
                from:"like",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"User",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline : [
                    {
                        $lookup:{
                            from:"subscription",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscriberCount:{
                                $size:"$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then:true,
                                     else:false,
                                    }
                            }
                        }
                    },
                    {
                        $project:{
                            username:1,
                            "avatar.url":1,
                            subscriberCount:1,
                            isSubscribed:1
                        }
                    }
                ]
            } 
        },
        {
            $addFields:{
                likeCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                "videoFile.url":1,
                 title:1,
                 description:1,
                 createdAt:1,
                 views:1,
                 subscriberCount:1,
                 likeCount:1,
                 isLiked:1,
                 duration:1,
                 comments:1,
            }
        }
    ])
    if(!fetchedVideo){
        throw new ApiError(500,"failed to fetch video");
    }

    //increment views by 1 if video fetched successfully
    await video.findByIdAndUpdate(
        videoId , {$inc:{views:1}} 
    )

    //add this video to userHistory of user who fetched this video
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet:{watchHistory:videoId}
        }
    )

    return res.status(200).json(
        new ApiResponse(200,fetchedVideo,"video details fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    // update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title , description } = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }

    if(!(title && description)){
        throw new ApiError(400,"title and description both field required");
    }

    const _video = await video.findById(videoId);

    if(!_video){
        throw new ApiError(400,"video not found , invalid videoId");
    }

    if(_video?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(500 , "only video owner can update the video");
    }

    //delete old update thumbnail and update with new one
    const thumbnailToDelete = _video.thumbnail.public_id ;

    //access localPath of new thumbnail
    const thumbnailLocalPath = req.file?.path 

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    const updateVideo = await video.findByIdAndUpdate(
        videoId ,
        {
            $set:{
                title ,
                description ,
                thumbnail : {
                    public_id : thumbnail.public_id,
                    url : thumbnail.url
                }
            }
        },
        {
            new : true
        }
    )

    if(!updateVideo){
        throw new ApiError(500, "Failed to update video please try again");
    }

    if (updateVideo) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "Video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
   
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }
    const _video = await video.findById(videoId);

    if(!_video){
        throw new ApiError(400,"video not found ! provide valid videId")
    }

    if(_video.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete this video");
    }

    const videoDelete = await video.findByIdAndDelete(videoId);
    
    if(!videoDelete){
        throw new ApiError(500, "Failed to delete the video please try again");
    }

    //delete thumbnail and video from cloudinary 
    await deleteOnCloudinary(_video?.thumbnail.public_id);
    await deleteOnCloudinary(_video.videoFile?.public_id , "video");

    //delete that video like
    await Like.deleteMany({video:videoId});
    
    //delete video Comment
    await Comment.deleteMany({video:videoId});

    return res.status(200).json(
        new ApiResponse(200, {} ,"video deleted successfully")
    );
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }

    const _video = await video.findById(videoId);

    if(!_video){
        throw new ApiError(400,"video not found : invalid videoId");
    }

    if(_video.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"you cant toggle video publish status as you are not owner")
    }

    const toggleVideoPublish = await video.findByIdAndUpdate(
        videoId , 
        {
            isPublished : !_video?.isPublished
        },
        {
            new : true
        }
    );

    if (!toggleVideoPublish) {
        throw new ApiError(500, "Failed to toggle video publish status");
    }

    return res.status(200).json(
        new ApiResponse(200,toggleVideoPublish,"Video publish toggled successfully")
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