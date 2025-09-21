import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import CatchAsyncError from "../middlewares/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { getRedis } from "../utils/redis";
import { getUserById } from "../services/user.services";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import CourseModel from "../models/course.models";

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


interface IActivateAccountRequest {
    activationToken: string;
    otp: string;
}

export const activeUser = CatchAsyncError(
    async (req: Request<{}, {}, IActivateAccountRequest>, res: Response, next: NextFunction) => {
        try {
            const { activationToken, otp } = req.body;

            const decoded = jwt.verify(
                activationToken,
                process.env.JWT_SECRET as string
            ) as { id: string; activationCode: string };

            if (decoded.activationCode !== otp) {
                return next(new ErrorHandler("Invalid activation code", 400));
            }

            const user = await UserModel.findById(decoded.id);
            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Account activated successfully",
            });
        } catch (error) {
            console.error("Error While Activating User:", error);
            return next(new ErrorHandler("Failed to Activate User", 500));
        }
    }
);

// Login User
interface ILoginBody {
    email: string,
    password: string
}

export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILoginBody;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter both email and password", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("User Not found. Please Sign Up.", 400));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid password", 400));
    }

    sendToken(user, 200, res);
});


export const logoutUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        getRedis().del(userId as string);

        res.status(200).json({
            success: true,
            message: "Logged Out Successfully"
        });
    }
);



// update access token
export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;

    if (!decoded) {
        return next(new ErrorHandler("Could not refresh token", 400));
    }
    const session = await getRedis().get(decoded.id as string);
    if (!session) {
        return next(new ErrorHandler("Could not refresh token", 400));
    }

    const user = JSON.parse(session);
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
        expiresIn: "5m"
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
        expiresIn: "3d"
    });
    req.user = user;
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
        status: "success",
        accessToken
    })

});

// Get User info 
export const getUserInfo = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId: string = req.user?._id as string;
        await getUserById(userId, res);
    });

// Social auth 
interface ISoialAuthBody {
    email: string,
    name: string,
    avatar: {
        public_id: string;
        url: string;
    };
}

export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, avatar } = req.body as ISoialAuthBody;

        let user = await UserModel.findOne({ email });

        if (!user) {
            user = await UserModel.create({
                email,
                name,
                avatar
            });
        }
        sendToken(user, 200, res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Update user Info
interface IUpdateUserInfo {
    name?: string,
    email?: string
}
export const updateUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body;
        const userId: String | undefined = req.user?._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        if (email && email !== user.email) {
            const isEmailExist = await UserModel.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler("Email already exists", 400));
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        if (avatar) {
            user.avatar = avatar;
        }
        await user.save();
        if (userId) {
            await getRedis().set(userId.toString(), JSON.stringify(user));
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { oldPassword, newPassword } = req.body as IUpdatePassword;

        const user = await UserModel.findById(req.user?._id).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid user", 400));
        }
        const isPasswordMatch = await user.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid password", 400));
        }

        user.password = newPassword;
        let redis = getRedis();
        await user.save();
        await redis.set(`${req.user?._id}`, JSON.stringify(user));

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
);


interface IUploadProfilePicture {
    avatar: string;
}

export const updateProfilePicture = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { avatar } = req.body as IUploadProfilePicture;

        const user = await UserModel.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler("Invalid user", 400));
        }

        if (user.avatar?.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };

        await user.save();
        await getRedis().set(`${req.user?._id}`, JSON.stringify(user));

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            avatar: user.avatar,
        });
    }
);
