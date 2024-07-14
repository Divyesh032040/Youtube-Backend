import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ErrorHandler.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateRefreshTokenAndAccessToken = async (userId)=>{
   try {
     const user = await User.findById(userId)
 
     const refreshToken =user.generateRefreshToken()
     const accessToken = user.generateAccessToken()
     //give refreshToken to User
    user.refreshToken = refreshToken
    //save that User with this token in DB
   await user.save({ validateBeforeSave : false })
 
   return {refreshToken,accessToken}
   } catch (error) {
       throw new ApiError(500,"Something went wrong while generating refresh and access token")
   }

}
//her we write main response of request / main logic of in-coming https request
const registerUser = asyncHandler(async (req,res) => {
    //get data from user 
     const {fullName,username,email,password} = req.body
    // console.log(req.body)

     //validate user detail - we can all apply if-else condition on each state
     if([fullName,username,email,password].some((field)=>field?.trim()==="")){
        throw ApiError(400,"all fields are required")
     }
     
     //check if use is already registered or not ?
     //we can access all users of data base via UserSchema which is User 
     const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //handle images : avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;   //multer adds files

    //console.log(avatarLocalPath)

    
   // const coverImageLocalPath = req.files?.coverimage[0]?.path
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
       
    coverImageLocalPath = req.files.coverimage?.[0]?.path
    //console.log(coverImageLocalPath)
   }

    //validation for avatar
    //upload file to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    //upload cover image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatarLocalPath) {
        throw new ApiError(400,"avatar image is required")
    }
  

    //validate is really avatar is there or not ?
    if(!avatar) throw new ApiError(400,"avatar image is required")

    //create obj in database and upload all user data into DB via create() query

   const user = await User.create({
        fullName,
        username : username,
        email,
        password,
        avatar : avatar?.url,
        coverimage : coverImage?.url || "",
    })

    const createdUser = await User.findOne({ _id: user._id }).select("-password -refreshToken");


    if(!createdUser)throw new ApiError(500,"something want wrong while registering user")
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});



//login user
const LoginUser = asyncHandler(async(req,res)=>{
    //get username and password from user 
    const {username , email , password} = req.body
    //verify its not empty fields
    if(!(username || email)){
        throw new ApiError(400,"username or email are required")
    }

    //find username or email in database
   const DBuser = await User.findOne({
        $or : [{username},{email}]
   })
   //show error if we not find user
   if (!DBuser) {
    throw new ApiError(401, "User does not exist");
  }

  const storedHash = DBuser.password;
  //console.log(`Stored hashed password: ${storedHash}`);

   //check password
  
   const isPasswordValid = await DBuser.isPasswordCorrect(password);


   if(isPasswordValid == false){
    throw new ApiError(401,"Invalid user credentials , provide correct password or emailId/username")
   }
   //give refresh token to user and save user with that token in DB and get return RT & AT
   const {refreshToken,accessToken} = await generateRefreshTokenAndAccessToken(DBuser._id)

   //now we have to send cookies to user but not password and 
   const loggedInUser = await User.findById(DBuser._id).select("-password -refreshToken")
   
   const options = {
        httpOnly : true ,
        secure : true 
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
       new ApiResponse(
           200, 
           {
               user: loggedInUser, accessToken, refreshToken
           },
           "User logged In Successfully"
       )
   )
})



//log out user
const logOutUser = asyncHandler(async(req,res)=>{
    const userId = req.user._id;

    if(!userId){
        throw new ApiError(400 , "fail authorization ")
    }
    //remove refresh token from user data in DB
    await User.findByIdAndUpdate(
        userId , 
        {
            $unset : {refreshToken : 1}
        },
        {
            new:true
    })

    //remove cookies
    const option = {
        httpOnly : true ,
        secure : true 
   }

   return res
   .status(200)
   .clearCookie("accessToken",option)
   .clearCookie("refreshToken",option)
   .json(new ApiResponse(200,{},"user logged out"))
})



//function for regenerate user's access toke via its refresh token
const accessRefreshToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if(!accessRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    //verify user refresh token via jwt.verify() function
  
     const decodedRefreshToken = Jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
  
     if(!decodedRefreshToken){
      throw new ApiError(401 , "invalid refreshToken");
     }
  
    const user = await User.findOne({
        refreshToken: incomingRefreshToken
    });
  
    if(!user){
      throw new ApiError(401 , "Invalid RefreshToken")
    }
  
    //verify incoming incomingRefreshToken and refreshToken which we save in user DB while creating generate while 
  
    if(incomingRefreshToken !== user.refreshToken){
      throw new ApiError(401 , "Refresh token is expired or used")
    }
  
    // now user is completely verify and we have to generate new token for that and send user in cookies
  
    const {newRefreshToken , newAccessToken } = await generateRefreshTokenAndAccessToken(user._id)
  
    // now send in cookies
    const options = {
      httpOnly:true,
      secure:true
    }
  
    return res
    .status(200)
    .cookie("refreshToken",newRefreshToken , options)
    .cookie("accessToken",newAccessToken,options)
    .json(new ApiResponse(200,{newRefreshToken , newAccessToken },"access token re-generated"))
  

})


//User detail update controller 
const UpdateUserPassword = asyncHandler(async(req,res)=>{
    
    try {
        const {newPassword , oldPassword , confPassword} = req.body

        if(!oldPassword){
            throw new ApiError(400,"oldPassword not provided ")
        }

        if(!(newPassword === confPassword)){
            throw new ApiError(400 , "Password not matched")
        }

        const user_id = req.user?._id
       // console.log(user_id);
        const user = await User.findById(user_id);
        //console.log(user)
        const decodedPassword = await user.isPasswordCorrect(oldPassword)
        
        if(!decodedPassword){
            throw new ApiError(400,"user not found")
        }

        user.password = newPassword;

        await user.save({validateBeforeSave : false})


    } catch (error) {
        //console.log(error);
      throw error
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , {} , "password changed successfully as")
    )
    
})

//function to provide a current user 
const getCurrentUser = asyncHandler(async(req,res)=>{

try {
          const currentUser = req.user  //come from middleware
    
          if(!currentUser){
            throw new ApiError(400,"user not find")
          }
    
          return res.status(500)
          .json(
            new ApiResponse(500 , {currentUser} , "current user found successfully")
          )
} catch (error) {
    throw new ApiError(400,error?.message || "current user not fount")
}
})



//update user account details 
const UserAccountDetailUpdate = asyncHandler(async(req,res)=>{
    const {fullName , email } = req.body

    if(!fullName || !email){
        throw new ApiError(400,'Something bad happened.');
    }

    const userId = req.user?._id

    const DBuser = await User.findByIdAndUpdate(
        userId ,
        {
            $set : { fullName , email }
        } ,
        {new : true} // it will return user details in DBuser after update it 
    ).select("-password")     // her we save one DB call

    res.status(200)
    .json(
        new ApiResponse(200, DBuser , "account details updated successfully ")
    )
})



//update user avatar
const updateUserAvatar = asyncHandler(async(req,res)=>{

        const avatarPath = req.file?.path

        if(!avatarPath){
            throw new ApiError(400,"avatar image missing");
        }

        const avatar = await uploadOnCloudinary(avatarPath)

        if(!avatar.url){
            throw new ApiError("avatar url not fount")
        }

       const user = await User.findByIdAndUpdate(
            req.body._id,
            {
                $set : {
                avatar : avatar.url}
            },
            {new:true}
        ).select("-password")

        return res.status(200)
        .json(
             new ApiResponse(200,{newAvatar : avatar.url},"avatar image updated successfully")
        )

})



//update user cover image
const updateUserCover = asyncHandler(async(req,res)=>{
   
    const coverImageLocalPath = req.file?.path

    //console.log(coverImageLocalPath);

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )

})



//get user channel profile  - Aggregation pipeline 
const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"user not found")
    }
    console.log(username);

    //Aggregation pipeline 
    const channel = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{

                subscribersCount:{$size:"$subscribers"},

                channelSubscribedToCount:{$size:"$subscribedTo"},

                isSubscribed:{
                    $cond:{
                        if:{ $in: [req.user?._id , "$subscribers.subscriber"]},
                        then:true,
                        else:false,
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullName:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                coverImage:1,
                avatar:1,
                email:1,
            }
        }
    
    ])

    //console.log(channel)
    
    if(!channel?.length){
        throw new ApiError(400,"channel dose not exist")
    }

    return res.status(200)
    .json(
       new ApiResponse(200, channel[0] , "user channel fetched successfully")
    )

})

//nested aggregation pipeline for get users watch history 
const watchHistory = asyncHandler(async(req,res)=>{
        const user = await User.aggregate([
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"WatchHistory",

                    pipeline:[{
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",

                            pipeline:[{
                                $project:{
                                    username:1,
                                    fullName:1,
                                    avatar:1
                                }
                            }]
                        }
                    }]
                },
                
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            }
        ])
            return res.status(200).json(
                new ApiResponse(200,user[0].watchHistory)
            )
})

export {
    registerUser,
    LoginUser,
    logOutUser,
    accessRefreshToken,
    UpdateUserPassword,
    getCurrentUser,
    UserAccountDetailUpdate,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile,
    watchHistory
}









