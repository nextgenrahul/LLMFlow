import { Response } from "express";
import UserModel from "../models/user.models";
import { getRedis } from "../utils/redis";

export const getUserById = async (id: string, res: Response) => {
    try {
        const userJson = await getRedis().get(id);
        let user;
        if (userJson) {
            user = JSON.parse(userJson)
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
