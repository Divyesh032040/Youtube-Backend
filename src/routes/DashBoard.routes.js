import { Router } from "express";
import {getChannelVideos , getChannelStats} from '../controllers/DashBoard.controller.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"
const dashboardRouter = Router();



dashboardRouter.route('/stats/:channelId').get(verifyJWT , getChannelStats)

dashboardRouter.route('/videos/:channelId').get(getChannelVideos);

export default dashboardRouter;