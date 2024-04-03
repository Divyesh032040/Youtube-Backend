import { Router } from "express";
import { registerUser } from "../controllers/User.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
    )

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
