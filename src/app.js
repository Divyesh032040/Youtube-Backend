import express from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'


const app = express()



app.use(cors({
    origin:process.env.CORS_ORIGIN ,
    Credential : true,
    //methods : ['GET', 'POST', 'PUT', 'DELETE'],
}))

//Handel data from various src 

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))            
app.use(cookieParser())

 //route import
import userRouter from "./routes/User.routes.js"
import tweetRouter from "./routes/Tweet.routes.js"
import playlistRouter from "./routes/Playlist.routes.js" 
import likeRouter from "./routes/Like.routes.js"
import commentRouter from "./routes/Comment.router.js"
import healthCheckerRouter from "./routes/HealthChecker.router.js"


//route declaration 
app.use("/api/v1/users",userRouter);

app.use("/api/v1/tweet",tweetRouter);

app.use("/api/v1/playlist",playlistRouter);

app.use("/api/v1/Like",likeRouter);

app.use("/api/v1/comment" , commentRouter);

app.use("/api/v1/healthCheck" , healthCheckerRouter);



export { app }