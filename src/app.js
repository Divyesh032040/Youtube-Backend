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

//route declaration 
app.use("/api/v1/users",userRouter);



export { app }