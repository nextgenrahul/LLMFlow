import { Request, Response, NextFunction } from "express";
import CatchAsyncError from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getRedis } from "../utils/redis";

// Authenticate User

export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token: string | undefined = req.cookies?.access_token;
    if (!access_token) {
        return next(new ErrorHandler("Please Login to access this resourse", 400));
    }
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded) {
        return next(new ErrorHandler("Access token is not valid.", 400));
    }

    const userData = await getRedis().get(decoded.id);

    if (!userData) {
        return next(new ErrorHandler("User not found in Redis", 404));
    }

    const user = JSON.parse(userData);

    req.user = user;
    next();
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return next(
                new ErrorHandler(
                    `Role: ${userRole || "Unknown"} is not allowed to access this resource.`,
                    403
                )
            );
        }
        next();
    };
};