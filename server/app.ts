import express, { NextFunction, Response, Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import ErrorHandler from "./utils/ErrorHandler";
import ErrorMiddleware from "./middlewares/error";
import dotenv from "dotenv";
import userRouter from "./routes/user.route";
dotenv.config();

export const app = express();
// Body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(cors({
    origin: process.env.ORIGIN
}));

// Routes
app.use('/api/v1/users', userRouter);



// texting api
app.get('/text', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "Api is working"
    })
})

// app.all("*", (req: Request, res: Response, next: NextFunction) => {
//     const err = new Error(`Route ${req.originalUrl} not found`) as any;
//     err.statusCode = 404;
//     next(err); 
// });


app.use(ErrorMiddleware)