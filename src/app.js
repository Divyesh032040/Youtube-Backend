import express, { json } from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'


const app = express()

export { app }

app.use(cors({
    origin:process.env.CORS_ORIGIN ,
    Credential : true,
    //methods : ['GET', 'POST', 'PUT', 'DELETE'],
}))

//Handel data from various src 

//handel json data vua express
app.use(express.json({limit:"16kb"}))
//handel data come from url to database 
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//public folder for data which anyone can access 
app.use(express.static("public"))

//we use cookieParser for "from over server we can access and set users browser cookie"
//cookieParser(secret, options)
app.use(cookieParser())

