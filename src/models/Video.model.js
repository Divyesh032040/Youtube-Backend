import mongoose from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const { model, Schema, models } = mongoose;

const videoSchema = new Schema({
    videoFile: {
        type: {
            url: String,
            public_id: String,
        },
        required: true,
    },
    thumbnail: {
        type: {
            url: String,
            public_id: String,
        },
            required:true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate);

//  const video = model("Video", videoSchema);

export const video = models.Video || model("Video", videoSchema);

// export { video }
