import { Router } from "express";
import { loginUser, logoutUser ,registerUser, refreshAccessToken, getCurrentUser, PassChange, updateEmail } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";


const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

userRouter.route("/logout").post(verifyJwt,logoutUser);


userRouter.route("/refresh-AccessToken").post( verifyJwt ,refreshAccessToken);

userRouter.route("/get-current-user").get(verifyJwt,getCurrentUser);

userRouter.route("/change-password").post(verifyJwt,PassChange);

userRouter.route("/update_email").patch(verifyJwt,updateEmail);



export {userRouter};