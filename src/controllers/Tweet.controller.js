import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/User.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //create tweet
    const content = req.body
    if(!content){
        return new ApiError(400 , "content is required");
    }
    const tweet = await Tweet.create({
        content , 
        owner : req.user?._id 
    })

    if(!tweet){
        return new ApiError(500,"fail to create tweet please try again");
    }

    return res.status(200).json(new ApiResponse(200, Tweet ,"Tweet created successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    // update tweet
    const {tweetId} = req.params._id;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"content is required");
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Content is not provided");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
       throw new ApiError(400,"tweet not found")
    }
    //validate tweet owner
    if(tweet?.owner.toString() != req.user?._id.toString()){
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
    if(req.params?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete tweet")
    }

    await Tweet.findByIdAndDelete(tweetId);

    res.status(200)
    .json(new ApiResponse(200,{tweetId},"tweet delete successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // get user tweets
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"userId is required");
    }
    const allTweet = await Tweet.aggregate([
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

                $pipeline : [
                    {
                        $project:{
                            username : 1 ,
                            avatar : 1
                        }
                    }
                ]  
            }
        },
        {
            $lookup:{
                from:"Like",
                localField:"_id",
                foreignField:"Likes",
                as:"likeDetail",

                $pipeline:[
                    {
                        $project:{
                            likeBy:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"likeDetail"
                },
                ownerDetail:{
                    $first:"$ownerDetail"
                },
                isLiked:{
                    $cond:{$in:[req.user?._id,"$likeDetails.likesBy"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
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