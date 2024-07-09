import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {deleteVideo , getAllVideos , getVideoById , publishAVideo , togglePublishStatus , updateVideo , } from "../controllers/Video.controller.js"

const videoRouter = Router();


// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

videoRouter
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
    );

videoRouter
    .route("/v/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

videoRouter.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default videoRouter;