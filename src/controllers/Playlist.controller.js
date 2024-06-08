import mongoose, {isValidObjectId} from "mongoose"
import {Playlist, playList} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { video } from "../models/Video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400,"both fields are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user?._id
    });

    if(!playList){
        throw new ApiError(400,"failed to create playlist ");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist ,"playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id");
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner : mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"videos"
                },
                totalViews:{
                    $sum:"videos.views"
                }
            }
        },
        {
            $project:{
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])

    return res.status(200).json( new ApiResponse(200,userPlaylist,"user playlist fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
   
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid Playlist id");
    }

    const Playlist = await Playlist.findById(playlistId);

    if(!Playlist){
        throw new ApiError(400,"playlist not found");
    }

    const playListVideo = playList.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },{
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"videos",
                as:"videos"
            }
        },
        {
            $match:{
                isPublished : true
            }
        },
        {
            $lookup:{
                from:"User",
                foreignField:"_id",
                localField:"owner",
                as:"owner"
            }
        },
        {
            $addFields:{
                totalVideos : {
                    $size : "$videos"
                } , 
                totalViews : {
                    $sum : "$videos.views"
                },
                owner : {
                    $first:"$owner"
                }
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalVi :1,
                videos:{
                     _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner:{
                    username :1,
                    fullName:1,
                    "avatar.url":1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,playListVideo,"videoPlaylist fetched successfully"))
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"booth fields are required")
    }

    const playList = await Playlist.findById(playlistId)
    const _video = await video.findById(videoId)

    if(!playList){
        throw new ApiError(400,"invalid playlist id")
    }
    if(!_video){
        throw new ApiError(400,"invalid video id")
    }

    if(
        playList.owner?.toString() && _video.owner?.toString() != req.user?._id.toString()
    ){
        throw new ApiError(400,"owner can add video to their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        Playlist?._id ,
        {
            $addToSet : {videos : videoId}
        },
        {new : true}

    )

    if(!updatedPlaylist){
        throw new ApiError(500,"fail to add video into playlist");
    }

    return res.status(200).json( new ApiResponse(200,updatedPlaylist,"video added on playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"both fields are required")
    }

    const playList = await Playlist.findById(playlistId)
    const _video = await video.findById(videoId)

    if(!playList){
        throw new ApiError(400,"invalid playlist id")
    }
    if(!_video){
        throw new ApiError(400,"invalid video id")
    }

    if(playList.owner?._id.toString() && _video.owner?._id.toString() != req.user?._id){
        throw new ApiError(400,"owner can add remove video from their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId ,
        {
            $pull: {
                videos : videoId
            }
        },
        {new:true}
    )

    return res.status(200).json(new ApiResponse(200 , updatedPlaylist ,"video removed from playlist successfully"))
 
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
 
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'Only the owner can delete this playlist');
    }

    await Playlist.findByIdAndDelete(playlist._id);

    return res.status(200).json(new ApiResponse(200, {}, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlistId")
    }
    if(!name || !description){
        throw new ApiError(400 , "both description and ame are required")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400 , "invalid playlistId")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set:{name,description}
        },
        {new:true}
    );

    return res.status(200).json( new ApiResponse(200 , updatedPlaylist ,"playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}