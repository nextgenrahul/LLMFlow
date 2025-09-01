import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisInstance: Redis | null = null;

export const getRedis = (): Redis => {
    if (!redisInstance) {
        if (!process.env.REDIS_URL) {
            throw new Error("Redis URL not found");
        }
        redisInstance = new Redis(process.env.REDIS_URL);
        console.log("✅ Redis Connected");
    }
    return redisInstance;
};
