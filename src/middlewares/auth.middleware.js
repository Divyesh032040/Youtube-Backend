
import { ApiError } from "../utils/ErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";


export const verifyJWT = asyncHandler(async (req, _ ,next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        //console.log(token)
        if(! token){
            throw new ApiError(404,"Unauthorized request")
        }
    
        //now we have a access token but wee have to verify it with our access token secret key from env file for authenticate that this is a token which we generate for user 
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        //to access user , we have _id inside a token , so with it we will get complete user detail from DB and remove password and refresh token field from it
        const user = await User.findById(decodedToken?._id).select(" -password -refreshToken")
        
       if(!user){
        throw new ApiError(401,"invalid access token")
       }
    
       //after remove password and refresh token from that user detail comes from DB , we will pass it into user req and call next()
       req.user = user    //via this we provide all user details in req
    
       next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})




/*

{middleware for access token user access token for logout functionalities}
- middleware for access user's access token via req.cookie or req.header.Authorization
- while generate a access token for user , we send a user detail like _id etc so we have to access it and verify user 
- we have to verify is this token is true or not 


inside req.header we have a Authorization which looks like following which contain a auth token Token 

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVII9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ipv6G4gRG9lIowaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adSqs5c

*/

