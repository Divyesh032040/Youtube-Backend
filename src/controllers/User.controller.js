import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ErrorHandler.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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


export {
    registerUser,
    LoginUser,
    logOutUser
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








*/

























































