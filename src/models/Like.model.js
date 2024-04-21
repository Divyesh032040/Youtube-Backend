import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({

    comment:{
        Type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    likeBy:{
        Type:Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        Type:Schema.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})



export const Like = new mongoose.model("Like",likeSchema)
