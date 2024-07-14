import { Router } from "express";
import { createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet } from "../controllers/Tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import {upload} from "../middlewares/multer.middleware.js"

const tweetRouter = Router()

tweetRouter.use(verifyJWT, upload.none());

// Route to create a new tweet
tweetRouter.route("/").post(createTweet);

// Route to get tweets of a specific user
tweetRouter.route("/user/:userId").get(getUserTweets);

// Route to update or delete a specific tweet
tweetRouter.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default tweetRouter;