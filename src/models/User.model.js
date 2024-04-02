import mongoose , {Schema} from 'mongoose'
import  Jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const UserSchema = new Schema(
{
    username:{
        type:String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        require:true,
        unique:true,
        lowercase:true
    },
    fullName:{
        type:String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinery url
        require:true,
    },
    coverimage:{
        type:String,
    },
    password:{
        type:String,
        require:true,
        unique:true
    },
    watchHistory:[
       {
        type:Schema.Types.ObjectId,
        ref:"video",
       }
    ],
    refreshToken : {
        type:String
    }
}  ,  {timestamps:true}
)

//password encryption if its changed
UserSchema.pre("save" , async function(next){      //use (function) for this reference
    if( ! this.isModified("password") ) next ()
    this.password = bcryptjs.hash(this.password , 10 )
    next()
})

//add custom method (isPasswordCorrect) in UserSchema for password validation 
UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcryptjs.compare(password , this.password)
}

//method for generate access token 
UserSchema.methods.generateAccessToken = function (){
    return Jwt.sign(
        {
            _id : this._id,
            username:this.username,
            fullName:this.fullName,
            email:this.email,
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//method for generate refresh token
UserSchema.methods.generateRefreshToken = function (){
    return Jwt.sign(
        {
            _id : this._id
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",UserSchema) //users

//database use for store video , avatar , coverImage etc is "cloudinery(free)"