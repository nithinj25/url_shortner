import { Request, Response, NextFunction } from "express";
import redis, { TTL } from "../services/redis";

const MAX_REQUEST = 100;

export const rateLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const ip = (req.headers["x-forwarded-for"] as string)
        ?.split(",")[0]
        .trim() || req.socket.remoteAddress || "unknown";

    const key = `rate:${ip}`;

    try{
        const requests = await redis.incr(key);
        if(requests === 1) {
            await redis.expire(key, TTL.RATE_LIMIT);
        }

        res.setHeader("x-RateLimit-limit", MAX_REQUEST);
        res.setHeader("X-RateLimit-remaining", Math.max(0, MAX_REQUEST - requests));

        if(requests > MAX_REQUEST){
            res.status(429).json({
                success: false,
                error: "too many requests. Please wait 15 minutes",
            });
            return;
        }

        next();
    } catch (err) {
        console.warn("Rate limiter bypassed: Redis unavailable (", (err as Error).message, ")");
        next();
    }

};

