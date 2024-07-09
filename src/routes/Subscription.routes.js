import { Router } from "express";
import { getUserChannelSubscribers , getSubscribedChannels , toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriberRouter = Router();

subscriberRouter.use(verifyJWT); //apply jwt_verify to all route 

subscriberRouter.route("/c/:channelId").get(getUserChannelSubscribers);

subscriberRouter.route("/c/:channelId").post(toggleSubscription);

subscriberRouter.route("/u/:subscriberId").get(getSubscribedChannels);

export default subscriberRouter;