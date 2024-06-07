import mongoose, {isValidObjectId} from "mongoose"
import {Playlist, playList} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400,"both fields are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.body?._id
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
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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