import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";


const app = express();

// COnnects Frontend and BAckend
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../frontend")));

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

app.use((req , res) => {
    console.log(`User requested an invalid url : ${req.url} at ${new Date().toISOString()}`);
    res.status(404).send("404 - Page Not Found");
});

export default app;

