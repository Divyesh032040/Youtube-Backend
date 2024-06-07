import mongoose , {Schema} from "mongoose"
import mongooseAggregatePaginate, { aggregatePaginate } from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema.model({
    videoFile:{
        type:String,
        require:true,
        index:true,
    },
    thumbnail:{
        type:String
    },
    title:{
        type:String,
        required:true,

    },
    description:{
        type:String
    },
    duration:{
        type:Number,
        required:true,
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner :{
        type:Schema.Types.ObjectId,
        ref:"User"
    }


} , {timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const video = mongoose.model("Video",videoSchema)