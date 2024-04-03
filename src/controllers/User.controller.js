import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ErrorHandler.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

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







export {registerUser}




//get data from user  - done
//validate data - not empty  
//check if user is already exist - via username or email
//check for avatar and cover image    
//upload image and cover photo on cloudinary via middle were "multer"       
//create a user object with user data and image,avatar url from d=cloudinary for db
//upload it into db

























































