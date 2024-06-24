import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos , toggleCommentLike , toggleTweetLike , toggleVideoLike  } from "../controllers/Like.controller.js";


const likeRouter = Router();

likeRouter.use(verifyJWT);  //apply verifyJwt to all routes

likeRouter.route("/videos").get(getLikedVideos);

likeRouter.route("/toggle/t/:tweetId").post(toggleTweetLike);

likeRouter.route("toggle/c/:commentId").post(toggleCommentLike);

likeRouter.route("toggle/v/:videoId").post(toggleVideoLike);

export default likeRouter;