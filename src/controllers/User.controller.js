import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ErrorHandler.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken"

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

    console.log(avatarLocalPath)

    
   // const coverImageLocalPath = req.files?.coverimage[0]?.path
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
       coverImageLocalPath = req.files.coverimage[0].path
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
   if(!DBuser){
    throw new ApiError(401,"User dose not exist")
   }

   //check password
   const isPasswordValid = await DBuser.isPasswordCorrect(password)
   //isPasswordCorrect is method which use bcryptjs.compareSync which gives true if Entered password is match with password in DB

   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
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
    //remove refresh token from user data in DB
    await User.findByIdAndUpdate(
        req.user._id , 
        {
            $set : {refreshToken : 1}
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
  try {
     const decodedRefreshToken = Jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
  
     if(!decodedRefreshToken){
      throw new ApiError(401 , "invalid refreshToken");
     }
  
    const user = await User.findById(decodedRefreshToken?._id)
  
    if(!user){
      throw new ApiError(401 , "Invalid RefreshToken")
    }
  
    //verify incoming incomingRefreshToken and refreshToken which we save in user DB while creating generate while 
  
    if(decodedRefreshToken !== user?.refreshToken){
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
    .cookies("refreshToken",newRefreshToken)
    .cookies("accessToken",newAccessToken)
    .json(new ApiResponse(200,{newRefreshToken , newAccessToken },"access token re-generated"))
  
  } catch (error) {
    throw new ApiError(400,error?.message || "invalid access token")
  }


})



//User detail update controller 
const UpdateUserPassword = asyncHandler(async(req,res)=>{
    
    try {
        const {newPassword , oldPassword , confPassword} = req.body

        if(!(newPassword === confPassword)){
            throw new ApiError(400 , "Password not matched")
        }

        const user_id = req.body?._id

        const user = await User.findById(user_id)

        const decodedPassword = await isPasswordCorrect(user.password , oldPassword)

        if(!decodedPassword){
            throw new ApiError(400,"user nto found")
        }

        user.password = newPassword;

        await user.save({validateBeforeSave : false})

    } catch (error) {
      throw ApiError(400,"something went wrong")
    }

    return res.status(200)
    .json(
        new ApiResponse(200 ,{}, "password changed successfully")
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
    throw new ApiError(400,error?.message || "current not fount")
}
})



//update user account details 
const UserAccountDetailUpdate = asyncHandler(async(req,res)=>{
    const {fullName , email } = req.user

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
             new ApiResponse(200,user,"avatar image updated successfully")
        )

})



//update user cover image
const updateUserCover = asyncHandler(async(req,res)=>{

    const avatarPath = req.file?.path

    if(!coverPath){
        throw new ApiError(400,"cover image missing");
    }

    const cover = await uploadOnCloudinary(avatarPath)

    if(!cover.url){
        throw new ApiError("cover url not fount")
    }

    const user = await User.findByIdAndUpdate(
        req.body._id,
        {
            $set : {
            coverimage : cover.url}
        },
        {new:true}
    ).select("-password")

    return res.status(200)
        .json(
             new ApiResponse(200,user,"cover image updated successfully")
        )

})



//get user channel profile  - Aggregation pipeline 
const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"user not found")
    }

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
                channelSubscribedToCount:{$size:"subscribedTo"},
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
        throw ApiError(400,"channel dose not exist")
    }

    res.status(200)
    .json(
       new ApiResponse(200, channel[0] , "user channel fetched successfully")
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
    getUserChannelProfile
}


/*
{Register user }
-get data from user  
-validate data 
-check if user is already exist - via username or email
-check for avatar and cover image (Handel files via multer)
-upload image and cover photo on cloudinary via middle were "multer" - avatar is required so is  avatar local path not find from multer , return error      
- create a user object with user data and string url of files present in cloud for save in DB
-send that object into DB via User(UserSchema) and return object as res to user with refresh token and password and if still user not Register -> show server error 


{Login user via refresh and access token}
-take username/email and password from user 
-verify - all field should be not empty
-find same username in DB -> if got user => verify its password using :
-bcryptjs.compareSync(password , this.password)  which compar encrypted password with out this.password
-if fail => send error 
-if matched => assign Refresh token and access token to user via cookies

{logout}
-her we don't have a username / email from user so access that user from DB , we have to design a middleware , which takes cookies from user about user info
- after know about user we will remove refresh token from user object from DB  


{refreshAccessToken}

- access user's refresh token 
{"NOTE":"to verify refresh/access token we have a method called jwt.verify(R/A token , R/A token secret_key) - it return bool value value "}
-note : jwt contain 3 things : header , payload data , verify signature (HPS)  

{REGISTER , LOGIN , LOGOUT , REGENERATE ACCESS TOKEN , User update Password , GET CURRENT USER , update user details }

 

*/

























































