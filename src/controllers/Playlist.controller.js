import mongoose, {isValidObjectId} from "mongoose"
import {playList} from "../models/playlist.model.js"
import {ApiError} from "../utils/ErrorHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {video} from "../models/Video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400,"both fields are required");
    }

    const _playlist = await playList.create({
        name,
        description,
        owner:req.user?._id
    });

    if(!_playlist){
        throw new ApiError(400,"failed to create playlist ");
    }

    return res.status(200).json(
        new ApiResponse(200, _playlist ,"playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id");
    }

    const userPlaylist = await playList.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"video",
                localField:"video",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.views"
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
   
   
        if (!isValidObjectId(playlistId)) {
          throw new ApiError(400, "Invalid PlaylistId");
        }
        const playlist = await playList.findOne({ _id: playlistId }).populate({
          path: "video",
          populate: { path: "owner", select: "username fullname avatar" },
        });
        if (!playlist) {
          throw new ApiError(404, "Playlist not found");
        }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"videoPlaylist fetched successfully"))
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"booth fields are required")
    }

    const _playList = await playList.findById(playlistId)
    const _video = await video.findById(videoId)

    if(!_playList){
        throw new ApiError(400,"invalid playlist id")
    }
    if(!_video){
        throw new ApiError(400,"invalid video id")
    }

    if(
        _playList.owner?.toString() && _video.owner?.toString() != req.user?._id.toString()
    ){
        throw new ApiError(400,"owner can add video to their playlist")
    }

    const updatedPlaylist = await playList.findByIdAndUpdate(
        _playList?._id ,
        {
            $addToSet : {video : videoId}
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

    const _playList = await playList.findById(playlistId)
    const _video = await video.findById(videoId)

    if(!_playList){
        throw new ApiError(400,"invalid playlist id")
    }
    if(!_video){
        throw new ApiError(400,"invalid video id")
    }

    if(_playList.owner?._id.toString() && _video.owner?._id.toString() != req.user?._id){
        throw new ApiError(400,"owner can add remove video from their playlist")
    }

    const updatedPlaylist = await playList.findByIdAndUpdate(
        playlistId ,
        {
            $pull: {
                video : videoId
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

    const _playlist = await playList.findById(playlistId);

    if (!_playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    if (_playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'Only the owner can delete this playlist');
    }

    await playList.findByIdAndDelete(_playlist._id);

    return res.status(200).json(new ApiResponse(200, {}, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlistId")
    }
    if(!name || !description){
        throw new ApiError(400 , "both name and description are required")
    }

    const playlist = await playList.findById(playlistId);

    if(!playlist){
        throw new ApiError(400 , "invalid playlistId")
    }

    const updatedPlaylist = await playList.findByIdAndUpdate(
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