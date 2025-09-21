import express, { NextFunction, Response, Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import ErrorHandler from "./utils/ErrorHandler";
import ErrorMiddleware from "./middlewares/error";
import dotenv from "dotenv";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";

dotenv.config();

export const app = express();
// Body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true
}));

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/courses', courseRouter);


app.use(ErrorMiddleware)