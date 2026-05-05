import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth";
import urlRoutes from "./routes/url";
import analyticsRoutes from "./routes/analytics";
import { Url } from "./models/Url";
import { Click } from "./models/Click";
import { parseUserAgent, getGeoFromIP } from "./services/geoip";
import { cacheUrl, getCachedUrl } from "./services/redis";
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.CLIENT_URL || "http://localhost:5173";
        if (!origin) return callback(null, true);
        if (origin.startsWith("http://localhost:") || origin === allowed || origin.startsWith("chrome-extension://")) {
            return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(rateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/:code", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    try {
        const { code } = req.params;

        const cachedUrl = await getCachedUrl(code);

        if (cachedUrl) {
            res.redirect(cachedUrl);
            setImmediate(async () => {
                try {
                    const url = await Url.findOne({ shortCode: code });
                    if (!url) return;
                    const userAgent = req.headers["user-agent"] || "";
                    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "";
                    const { device, browser, os } = parseUserAgent(userAgent);
                    const geo = await getGeoFromIP(ip);
                    await Promise.all([
                        Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } }),
                        Click.create({ urlId: url._id, owner: url.owner, ip, country: geo.country, city: geo.city, device, browser, os, referrer: req.headers["referer"] || null }),
                    ]);
                } catch (err) {
                    console.error("Analytics error (cache hit): ", err);
                }
            });
            return;
        }

        const url = await Url.findOne({ shortCode: code, isActive: true });

        if (!url) {
            res.status(404).json({ error: "Short url not found" });
            return;
        }

        if (url.expiresAt && url.expiresAt < new Date()) {
            url.isActive = false;
            await url.save();
            res.status(410).json({ error: "this short url has expired" });
            return;
        }

        await cacheUrl(code, url.originalUrl);
        res.redirect(url.originalUrl);

        setImmediate(async () => {
            try {
                const userAgent = req.headers["user-agent"] || "";
                const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "";
                const { device, browser, os } = parseUserAgent(userAgent);
                const geo = await getGeoFromIP(ip);
                await Promise.all([
                    Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } }),
                    Click.create({ urlId: url._id, owner: url.owner, ip, country: geo.country, city: geo.city, device, browser, os, referrer: req.headers["referer"] || null }),
                ]);
            } catch (err) {
                console.error("Analytics error (cache miss): ", err);
            }
        });

    } catch (err) {
        console.error("Redirect error: ", err);
        res.status(500).json({ error: "server error" });
    }
});

export default app;
