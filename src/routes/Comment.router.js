import { Router } from "express";
import {getVideoComments, 
    addComment, 
    updateComment,
    deleteComment} from "../controllers/Comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const commentRouter = Router();

commentRouter.use(verifyJWT , upload.none());

commentRouter.route("/v/:videoId").post(addComment).get(getVideoComments);

commentRouter.route("/c/:commentId").delete(deleteComment).patch(updateComment);


export default commentRouter;