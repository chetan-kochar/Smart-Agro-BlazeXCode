import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import multer from "multer";

const app = express();

// Limits the incoming json data
app.use(express.json({limit:"16kb"}));

// Ensures only known origin access backend - CAUTION : Currently set to all origin
app.use(cors({origin : process.env.CORS_ORIGIN ,credentials:true}))

// Ensures proper parsing of url queries
app.use(express.urlencoded({extended:true , limit:"16kb"}))

// Public folder will contain resources which will be publicably availabel
app.use(express.static("public"))

// To manage cookies
app.use(cookieParser())

app.use(multer().none());

// Route imports
import {userRouter} from "./src/routes/user.route.js";


// Router Declaration
app.use("/api/v1/user",userRouter)

export default app;

