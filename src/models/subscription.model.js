import mongoose , {Schema, Types} from "mongoose"

const SubscriptionSchema = new Schema({

    //user who subscribed channel
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },

    //user whom subscribers are subscribing 
    channel : {
       type : Schema.Types.ObjectId ,
       ref : "User"
    }
} , {timestamps:true})

export const Subscription = mongoose.model("Subscription",SubscriptionSchema)