import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;

    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Internal Server Error";

    // Wrong MongoDB ID Error
    if (error.name === "CastError") {
        const message = `Resource not found. Invalid: ${error.path}`;
        error = new ErrorHandler(message, 400);
    }

    // Duplicate key Error
    if (error.code === 11000) {
        const message = `Duplicate ${Object.keys(error.keyValue)} entered`;
        error = new ErrorHandler(message, 400);
    }

    // Wrong JWT Error
    if (error.name === "JsonWebTokenError") {
        const message = `JSON Web Token is invalid, try again`;
        error = new ErrorHandler(message, 400);
    }

    // JWT Expired Error
    if (error.name === "TokenExpiredError") {
        const message = `JSON Web Token has expired, try again`;
        error = new ErrorHandler(message, 400);
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message
    });
};

export default ErrorMiddleware;
