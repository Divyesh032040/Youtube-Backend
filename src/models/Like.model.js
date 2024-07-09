import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({

    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    likeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})



//export const Like = mongoose.model("Like",likeSchema)
export const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);
