import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ErrorHandler.js"

const healthChecker = asyncHandler(async(req,res)=>{
    return res.status(200).json(( new ApiResponse(200 , "server status : good")));
})

export {healthChecker};