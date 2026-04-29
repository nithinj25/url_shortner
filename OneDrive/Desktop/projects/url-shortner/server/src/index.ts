import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

//Routes
import authRoutes from "./routes/auth";
import urlRoutes from "./routes/url";
import analyticsRoutes from "./routes/analytics";

//models
import { Url } from "./models/Url";
import { Click } from "./models/Click";

//Services
import { parseUserAgent, getGeoFromIP } from "./services/geoip";
import { cacheUrl, getCachedUrl } from "./services/redis";

//middleware
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.CLIENT_URL || "http://localhost:5173";
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // In dev, allow any localhost port
        if (origin.startsWith("http://localhost:") || origin === allowed) {
            return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(rateLimiter);
app.use("/api/auth", authRoutes)
app.use("/api/url", urlRoutes)
app.use("/api/analytics", analyticsRoutes)

app.get(
    "/:code",
    async(req: Request<{code: string}>, res: Response): Promise<void> => {
        try{
            const { code } = req.params;

            const cachedUrl = await getCachedUrl(code);

            if(cachedUrl){
                console.log(`Cache hit for/${code}`);
                res.redirect(cachedUrl);

                setImmediate(async () => {
                    try{
                        const url = await Url.findOne({ shortCode: code });
                        if(!url) return;

                        const userAgent = req.headers["user-agent"] || "";
                        const ip = 
                            (req.headers["x-forwarded-for"] as string)
                                ?.split(",")[0]
                                .trim() || req.socket.remoteAddress || "";
                        
                        const { device, browser, os } = parseUserAgent(userAgent);
                        const geo = await getGeoFromIP(ip);

                        await Promise.all([
                            Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1}}),

                            Click.create({
                                urlId: url._id,
                                owner: url.owner,
                                ip,
                                country: geo.country,
                                city: geo.city,
                                device,
                                browser,
                                os,
                                referrer: req.headers["referer"] || null,
                            }),
                        ]);
                    } catch (err){
                        console.error("Analytics error (cache hit): ", err);
                    }
                });
                return;
            }

            console.log(`Cache miss for /${code} - query mongoDb`);

            const url = await Url.findOne({
                shortCode: code,
                isActive: true,
            });

            if(!url) {
                res.status(404).json({ error: "Short url not found"});
                return;
            }

            if(url.expiresAt && url.expiresAt < new Date()){
                url.isActive = false;
                await url.save();
                res.status(410).json({ error: "this short url has expired "});
                return;
            }

            await cacheUrl(code, url.originalUrl);

            res.redirect(url.originalUrl);

            setImmediate(async() => {
                try{
                    const userAgent = req.headers["user-agent"] || "";
                    const ip = 
                        (req.headers["x-forwarded-for"] as string)
                            ?.split(",")[0]
                            .trim() || req.socket.remoteAddress || "";
                            
                    const { device, browser, os } = parseUserAgent(userAgent);
                    const geo = await getGeoFromIP(ip);

                    await Promise.all([
                        Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1}}),
                        Click.create({
                            urlId: url._id,
                            owner: url.owner,
                            ip,
                            country: geo.country,
                            city: geo.city,
                            device,
                            browser,
                            os,
                            referrer: (req.headers["referer"]) || null,
                        }),
                    ]);

                } catch (err){
                    console.error("Analytics error (cache miss): ", err);
                }
            });

        } catch (err){
            console.error("Redirect error: ", err);
            res.status(500).json({ error: "server error "});
        }
    }
);

const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI as string;

mongoose    
    .connect(MONGO_URI)
    .then(() => {
        console.log("MonogDb connected");
        app.listen(PORT, () => {
            console.log(`server running `)
        });
    })
.catch((err: Error) => {
    console.error(" mongoDb connection failed: ", err.message);
    process.exit(1);
});

const shutdown = async () => {
    console.log("Shutting down server");
    await mongoose.connection.close();
    console.log("MongoDb connection closed");
    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

