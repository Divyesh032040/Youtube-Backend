import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId")
    }
    const alreadyLikedVideo = await Like.findOne({
        video : videoId ,
        likeBy : req.user?._id
    });

    
    if(alreadyLikedVideo){
        await Like.findByIdAndDelete(alreadyLikedVideo?._id)

        return res.status(200).json( new ApiResponse(200,{isLiked:false})
        )
    }

    await Like.create({
        video : videoId, 
        likeBy : req.user?._id
    })

    return res.status(200).json( new ApiResponse(200,{isLiked:true}))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid commentId")
    }
    const likeAlready = await Like.findOne({
        comment : commentId ,
        likeBy : req.user?._id
    })

    if(likeAlready){
        await Like.findByIdAndDelete(likeAlready?._id);
        return res.status(200).json( new ApiResponse(200,{isLiked:false})
        )
    }
    await Like.create({
         comment : commentId,
         likeBy : req.user?._id
    })

    return res.status(200).json( new ApiResponse(200,{isLiked : true },"comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400,"invalid tweetId")
    }
    const likeAlready = await Like.findOne({
        tweet : tweetId,
        likeBy : req.user?._id
    })

    if(likeAlready){
        await Like.findByIdAndDelete(likeAlready?._id);
        return res.status(200).json( new ApiResponse(200 , {isLikes : false}))
    }

    await Like.create({
        tweet : tweetId ,
        likeBy : req.use?._id
    })
    return res.status(200).json( new ApiResponse(200,{isLiked:true}))
}
)

    const getLikedVideos = asyncHandler(async (req, res) => {
        const userId = req.user?._id;
        const userId_ = new mongoose.Types.ObjectId(userId)
        let videos = await Like.aggregate(
            [
                {
                    $match: {
                        likeBy: userId_,
                        video: {
                        $exists: true,
                        },
                    },
                },
                {
                    $lookup: {
                    from: "video",
                    localField: "video",
                    foreignField: "_id",
                     as: "videos",
                              }
                            }           
           
    ])
        
          if (videos.length < 1) {
            throw new ApiError(400, "User has not liked any videos yet");
          }
        
          return res
            .status(200)
            .json(
              new ApiResponse(200, videos, "Liked videos fetched successfully")
            );
        });
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}