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
// UserSchema.pre("save" , async function(next){      //use (function) for this reference
//     if( ! this.isModified("password") ) next ()
//     this.password = bcryptjs.hashSync(this.password , 10 )    //bcryptjs -> hashSync 
//     next()                                                    //bcrypt -> hash
// })

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  });

//add custom method (isPasswordCorrect) in UserSchema for password validation 
// UserSchema.methods.isPasswordCorrect = async function (password) {
//     return bcryptjs.compareSync(password , this.password)
// }
UserSchema.methods.isPasswordCorrect = async function (password) {
    try {
        console.log(password)
        return bcryptjs.compareSync(password , this.password);
    } catch (error) {
        throw new Error(error);
    }
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export {User}
// export const User = mongoose.model("User",UserSchema) //users

//database use for store video , avatar , coverImage etc is "cloudinery (free)"

//IMPORTANT NOTE : this all methods which we create are available with our "user" we stored in DB
//where other methods like findOne() etc are available via mongoDB's mongoose 
//mean we can not so username.findOne() or User.isPasswordCorrect