import { Router } from "express";
import { createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet } from "../controllers/Tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const tweetRouter = Router()

// Route to create a new tweet
tweetRouter.post("/", verifyJWT ,createTweet);

// Route to get tweets of a specific user
tweetRouter.get("/user/:userId", verifyJWT , getUserTweets);

// Route to update or delete a specific tweet
tweetRouter.patch("/:tweetId", verifyJWT , updateTweet);
tweetRouter.delete("/:tweetId", verifyJWT , deleteTweet);

export default tweetRouter;