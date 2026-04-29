import { Request, Response, NextFunction } from "express";
import redis, { TTL } from "../services/redis";

const MAX_AUTH_REQUESTS = 10;

export const authRateLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const ip = (req.headers["x-forwarded-for"] as string)
        ?.split(",")[0]
        .trim() || req.socket.remoteAddress || "unknown";

    const key = `auth:rate:${ip}`;

    try {
        const requests = await redis.incr(key);
        if (requests === 1) {
            await redis.expire(key, TTL.RATE_LIMIT);
        }

        if (requests > MAX_AUTH_REQUESTS) {
            res.status(429).json({
                success: false,
                error: "Too many attempts. Please wait 15 minutes.",
            });
            return;
        }

        next();
    } catch {
        next();
    }
};