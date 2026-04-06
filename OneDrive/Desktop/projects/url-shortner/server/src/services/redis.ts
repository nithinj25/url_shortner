import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    enableOfflineQueue: false,
});

redis.on("connect", ()=> console.log("redis connected"));
redis.on("error", (err) => console.error("Redis error: ", err.message));

export const TTL = {
  URL_REDIRECT: 60 * 60 * 24,  // 24 hours — short URL lookups
  RATE_LIMIT:   60 * 15,       // 15 minutes — rate limit windows
};

export const cacheUrl = async (
    shortCode: string,
    originalUrl: string
): Promise<void> => {
    try {
        await redis.setex(`url:${shortCode}`, TTL.URL_REDIRECT, originalUrl);
    } catch (err) {
        console.error("Redis cache error:", err);
    }
};

export const getCachedUrl = async (
    shortCode: string
) : Promise<string | null> => {
    try {
        return await redis.get(`url:${shortCode}`);
    } catch (err) {
        console.error("Redis get error:", err);
        return null;
    }
}

const getOriginalUrlLookupKey = (ownerId: string, originalUrl: string): string => {
    return `url:lookup:${ownerId}:${encodeURIComponent(originalUrl)}`;
};

export const cacheOriginalUrlLookup = async (
    ownerId: string,
    originalUrl: string,
    shortCode: string
): Promise<void> => {
    try {
        await redis.setex(
            getOriginalUrlLookupKey(ownerId, originalUrl),
            TTL.URL_REDIRECT,
            shortCode
        );
    } catch (err) {
        console.error("Redis cache error:", err);
    }
};

export const getCachedShortCodeByOriginalUrl = async (
    ownerId: string,
    originalUrl: string
): Promise<string | null> => {
    try {
        return await redis.get(getOriginalUrlLookupKey(ownerId, originalUrl));
    } catch (err) {
        console.error("Redis get error:", err);
        return null;
    }
};

export const invalidateUrl = async (shortCode: string): Promise<void> => {
    try {
        await redis.del(`url:${shortCode}`);
    } catch (err) {
        console.error("Redis delete error:", err);
    }
};

export default redis;

