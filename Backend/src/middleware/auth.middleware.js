import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asynchandler.js";

const verifyJwt = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        // req.header for mobile apps

        if(!token){throw new ApiErrors(401,"Unauthorized Access")};

        const decryptToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decryptToken?._id).select("-password -refreshToken");

        if(!user){throw new ApiErrors(401,"Unauthorized Access")}

        req.user = user;
        next()

    }
    catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid access token")
    }
})

export {verifyJwt}
