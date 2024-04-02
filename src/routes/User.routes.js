import { Router } from "express";
import { registerUser } from "../controllers/User.controller.js";

const userRouter = Router()

userRouter.route("/register").post(registerUser)

export default userRouter

// const registerUser = asyncHandler(async (req,res) => {
//     res.status(200).json({
//         massage:"ok"
//     })
// })