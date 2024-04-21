import mongoose, { Schema, Types } from "mongoose";

const playLitSchema = new Schema({
    name:{
        Type:String,
        required:true ,
    },
    description:{
        Type:String,
        required:true ,
    },
    owner:{
        Type:Schema.Types.ObjectId,
        ref:"User"
    },
    video:[
        {
            Type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ]


},{timestamps:true})

export const playList = mongoose.model("PlayList",playLitSchema)