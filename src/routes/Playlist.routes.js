import { Router } from "express";
import { createPlaylist,
        getUserPlaylists,
        getPlaylistById,
        addVideoToPlaylist,
        removeVideoFromPlaylist,
        deletePlaylist,
        updatePlaylist  } 
        from "../controllers/Playlist.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const playlistRouter = Router();

playlistRouter.use(verifyJWT,upload.none())  // Apply verifyJWT middleware to all routes in this file 

playlistRouter.route("/").post(createPlaylist)

playlistRouter.route("/:playlistId")
        .get(getPlaylistById)
        .patch(updatePlaylist)
        .delete(deletePlaylist);

playlistRouter.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
playlistRouter.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

playlistRouter.get("/user/:userId",getUserPlaylists);

export default playlistRouter;