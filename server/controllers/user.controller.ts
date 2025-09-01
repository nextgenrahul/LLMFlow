import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import CatchAsyncError from "../middlewares/catchAsyncErrors";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";

// ---------------------------
// JWT Activation Token Type
// ---------------------------
interface IActivationToken {
    token: string;
    activationCode: string;
}
interface IUserMinimal {
    _id: string;
}

// ---------------------------
// Create Activation Token
// ---------------------------
export const createActivationToken = (user: IUserMinimal): IActivationToken => {
    if (!process.env.JWT_SECRET) {
        throw new ErrorHandler("JWT_SECRET is not defined in environment variables", 500);
    }

    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const payload = { id: user._id, activationCode };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "5m",
    });

    return {
        token,
        activationCode,
    };
};

// Register User
interface IRegisterUser {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

// ---------------------------
// Register User Controller
// ---------------------------
export const registerUser = CatchAsyncError(
    async (req: Request<{}, {}, IRegisterUser>, res: Response, next: NextFunction) => {
        try {
            const { name, email, password, avatar } = req.body;

            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return next(new ErrorHandler("User already exists", 400));
            }

            const newUser = await UserModel.create({
                name,
                email,
                password,
                avatar,
            });

            const activationToken = createActivationToken({
                _id: newUser._id.toString(),
            } as IUserMinimal);
           
            res.json({
                success: true,
                message: "User registered successfully",
                activationToken: activationToken.token,
                otpToken: activationToken.activationCode,
            });
        } catch (error) {
            console.error("Error registering user:", error);
            return next(new ErrorHandler("Failed to register user", 500));
        }
    }
);



