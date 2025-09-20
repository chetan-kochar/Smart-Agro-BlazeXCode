import { asyncHandler } from "../utils/asynchandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, removeFromCloudinary } from "../utils/Cloudinary.js";
import { ApiResponses } from "../utils/ApiResponses.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Creating options for sending cookies securely
const options = {
    httpOnly : true,
    secure : true
}

const generateAccess_RefreshToken = async (user_id)=>{
try {
        const user = await User.findOne({_id : user_id});

        if(!user){throw new ApiErrors(501,"User not found")}

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        if(accessToken && refreshToken){console.log("New tokens generated")};

        return {
           accessToken,
           refreshToken
        }
} catch (error) { throw new ApiErrors(501 ,"Something went wrong while generating referesh and access token\n"+ error?.message )
}
}

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // Step 1 : Fetching user data from form
    const {username , email , password} = req.body;
    
    // Step 2 : Validation
    if(
        [username , email , password].some((field)=>field?.trim()=="")
    ){
        throw new ApiErrors("400","All fields are required");
    }

    // Step 3 : Checking for already registered user
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiErrors(409, "User with same username or email already exists")
    };

    // Step 6 : Creating entry in User dB
    const user = await User.create({
        username : username.toLowerCase()
        ,email
        ,password
    });

    // Step 7 : Removing password and refreshToken from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

     // Step 8 : Checking if user registered to dB
    if(!createdUser){throw new ApiErrors(500,"Something went wrong while registering the user")};

    // Step 9 : Returning a response
    return res.status(200).json(
        new ApiResponses(200,createdUser,"User successfully registered")
    );


})

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if username or email is provided
    if (!(username || email)) {
        throw new ApiErrors(400, "Username or email is required");
    }

    // Find user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiErrors(404, "User not found");
    }

    // Check password
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiErrors(401, "Invalid password");
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });

    // Respond with user data (excluding password and refreshToken)
    const userData = await User.findById(user._id).select("-password -refreshToken");
    return res.status(200).json(
        new ApiResponses(200, { user: userData, accessToken }, "Login successful")
    );
});

const logoutUser = asyncHandler(async (req,res)=>{
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    if(!user){
        throw new ApiErrors(502,"Could'nt find the user")
    }

     const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponses(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    try {
        const userRefreshToken = req.cookies?.accessToken || req.body?.refreshToken;
        
        if(!userRefreshToken){throw new ApiErrors(401 , "Unauthorized Access")}
    
        const decodedToken = await jwt.verify(
            userRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        
        if(!decodedToken){throw new ApiErrors(501 , "Something went wrong while decoding refresh token")}

        const user = await User.findById(decodedToken?._id)
        
        if(!user){throw new ApiErrors(401,"Invalid Refresh Token")}
    
        if(user.refreshToken !== userRefreshToken){
            throw new ApiErrors(401, "Refresh token is expired or used")
        }
    
        const {accessToken , refreshToken } = await generateAccess_RefreshToken(user._id);

        if(accessToken && refreshToken){console.log("New tokens assigned to variables")}
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponses(
                200,
                {accessToken : accessToken, refreshToken: refreshToken},
                "Access Token refreshed"
            )
        )
    } 
    catch (error) {
        throw new ApiErrors(400 , error?.message || "Invalid Refresh Token")        
    }   
})

const PassChange = asyncHandler(async (req ,res)=>{
    try {
        const {oldPass , newPass , confirmPass} = req.body;
        
        if(!(newPass === confirmPass )){throw new ApiErrors(401 , "New password and current password must be matching")}

        const user = await User.findById(req.user?._id)
        
        if(!user){throw new ApiErrors(502, error.message || "User not found")}

        if(!(await user.isPasswordCorrect(oldPass))){throw new ApiErrors("401" , "Incorrect old password")}

        user.password  = newPass;
        await user.save({validateBeforeSave : false})

        return res
        .status(200)
        .json(new ApiResponses(
            200,
            {},
            "Password Successfully changed"
        ))
    } 
    catch (error) {
        throw new ApiErrors(401 ,error?.message || "Something went wrong while changing password")        
    }
})

const getCurrentUser = asyncHandler( async(req , res) => {
    return res
    .status(200)
    .json(new ApiResponses(
        200,
        req.user,
        "User successfully fetched"
    ))
})

const updateEmail = asyncHandler(async (req , res)=>{
    const {newEmail} = req.body ; 
    if(!(newEmail)){throw new ApiErrors(401 , "New Email is required")};

    const user = await User.findByIdAndUpdate(
        {_id : req.user?._id},
        {
            $set : {
                email : newEmail
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponses(
        200,
        user,
        "Email changed successfully"
    ))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    PassChange,
    getCurrentUser,
    updateEmail
};