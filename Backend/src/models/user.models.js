import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username:{
        type: String,
        required : true,
        unique : [true,"Unique Username required"],
        lowercase : true,
        trim : true,
        index : true //Helps in finding/sorting
    },
    email : {
        type: String,
        required : true,
        unique : [true,"Email already registered."],
        lowercase : true,
        trim : true
    },
    password : {
        type : String,
        required : [true , "Password is required"]
    },
    refreshToken: {
        type: String
    }
},{timestamps:true})

userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password =  await bcrypt.hash(this.password , 10);
        return next();
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
    
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)