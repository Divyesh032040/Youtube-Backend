import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const CommentSchema = new Schema({

    content:{
        type:String,
        required:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }


},{timestamps:true})

CommentSchema.plugin(mongooseAggregatePaginate)
export const Comment = new mongoose.model("Comment",CommentSchema)
