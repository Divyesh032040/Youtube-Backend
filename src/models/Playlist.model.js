import mongoose , {Schema} from 'mongoose'

const playLitSchema = new Schema({
    name:{
        type:String,
        required:true ,
    },
    description:{
        type:String,
        required:true ,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    video:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ]


},{timestamps:true})

export const playList = mongoose.model("PlayList",playLitSchema)