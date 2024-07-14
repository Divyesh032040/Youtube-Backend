import mongoose, { isValidObjectId } from "mongoose"
import {User} from "../models/User.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {tweet} from "../models/Tweet.model.js"

const createTweet = asyncHandler(async (req, res) => {
    //create tweet
  
    const {content} = req.body
  
    if(!content){
        return new ApiError(400 , "content is required");
    }
    console.log("test 1")
    const _tweet = await tweet.create({
        content , 
        owner : req.user?._id 
    })

    if(!_tweet){
        return new ApiError(500,"fail to create tweet please try again");
    }

    return res.status(200).json(new ApiResponse(200, _tweet ,"Tweet created successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    // update tweet
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"content is required");
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Content is not provided");
    }

    const _tweet = await tweet.findById(tweetId);

    if(!_tweet){
       throw new ApiError(400,"tweet not found")
    }
    //validate tweet owner
    if(_tweet?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"only owner can edit there tweet")
    }

    //update tweet in DB , aggregation pipeline

    const newTweet = await tweet.findByIdAndUpdate(
        tweetId , 

        {
            $set : {content},
        } ,

        {new:true}
    )
    
    if(!newTweet){
        throw new ApiError(400,"Failed to edit tweet please try again");
    }

    return res.status(200)
    .json(new ApiResponse(200,newTweet,"Tweet updated successfully"));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //delete tweet
    const {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400,'Please provide tweetId');
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweetID")
    }

    const _tweet = await tweet.findById(tweetId);

    if(_tweet.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete tweet")
    }

    await tweet.findByIdAndDelete(tweetId);

    res.status(200)
    .json(new ApiResponse(200,{tweetId},"tweet delete successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"userId is required");
    }
    const allTweet = await tweet.aggregate([
        //stage:1 filer find user by user Id in owner collection
        {
            $match : { owner : new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup:{
                from:"User",
                localField:"owner",
                foreignField:"_id",
                as:"userDetails",

                pipeline : [
                    {
                        $project:{
                            username : 1 ,
                            "avatar.url" : 1
                        }
                    }
                ]  
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $project:{
                content:1,
                ownerDetail:1,
                likesCount:1,
                createdAt:1,
                isLiked:1
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,allTweet,"Tweet fetched successfully"))
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}