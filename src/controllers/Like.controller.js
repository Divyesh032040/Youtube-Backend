import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {video} from "../models/Video.model.js"

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

    return res.status(200).json( new ApiResponse(200,{isLiked : true }))

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
    const user = req.user
    const userId = user._id
    const likedVideos = await video.aggregate([
        {
            $match:mongoose.Types.ObjectId(userId)
        },
        {
            $lookup:{
                from:"video",
                foreignField:"_id",
                localField:"video",
                as:"likedVideo",
                $pipeline : [
                    {
                        $lookup:{
                            from:"User",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails"
                        }
                    },
                    {
                        $unwind:"$ownerDetails"
                    }
                ]
            }
        },{
            $unwind:"$likedVideo"
        },
        {
            $sort:{
                createdAt:-1
            }
        },{
            $project:{
                _id:0,
                likedVideo:{
                    _id:1,
                   "videoFile.url":1,
                    "thumbnail.url":1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    }
                }
            }
        }
    ])
    return res.status(200).json( new ApiResponse(200,likedVideos,"videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}