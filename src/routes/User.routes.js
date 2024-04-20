import { Router } from "express";

import { LoginUser, UpdateUserPassword, UserAccountDetailUpdate, accessRefreshToken, getCurrentUser, getUserChannelProfile, logOutUser, registerUser, updateUserAvatar, updateUserCover, watchHistory  } from "../controllers/User.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1 }, 
        { name: "coverimage", maxCount: 1 }
    ]), registerUser 
)

userRouter.route("/login").post(LoginUser)

userRouter.route("/logout").post( verifyJWT , logOutUser)  

userRouter.route("/refreshToken").post(accessRefreshToken)

userRouter.route("update-user-password").post(verifyJWT,UpdateUserPassword)

userRouter.route("/get-currant-user").get(verifyJWT,getCurrentUser)

userRouter.route("/update-account").patch(verifyJWT,UserAccountDetailUpdate)

userRouter.route("/update-user-avatar").post(verifyJWT, upload.single("avatar") ,updateUserAvatar)

userRouter.route("/update-user-cover").patch(verifyJWT,upload.single("coverImage"),updateUserCover)

userRouter.route("/channel/:username").get(verifyJWT,getUserChannelProfile)

userRouter.route("/watch-history").get(verifyJWT,watchHistory)



export default userRouter


/*
multer add files in req , to handle files and its looks accordingly
coverimage: [
    {
      fieldname: 'coverimage',
      originalname: 'cynthia.png',
      encoding: '7bit',
      mimetype: 'image/png',
      destination: './public/temp',
      filename: 'cynthia.png',
      path: 'public\\temp\\cynthia.png',
      size: 158364
    }
  ]


*/
