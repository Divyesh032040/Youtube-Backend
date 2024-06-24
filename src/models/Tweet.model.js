import mongoose, { Schema } from "mongoose"

const tweetSchema = new Schema({

    owner:{
        Type:Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        Type:String,
        required:true
    }

},{timestamps:true})

export const tweet = mongoose.model("Tweet",tweetSchema)