import { Router } from "express";
import {getVideoComments, 
    addComment, 
    updateComment,
    deleteComment} from "../controllers/Comment.controller"
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const commentRouter = Router();

commentRouter.use(verifyJWT , upload.none());

commentRouter.route("/v/:videoId").post(addComment).get(getVideoComments);

commentRouter.route("/c/commentId").delete(deleteComment).patch(updateComment);


export default commentRouter;