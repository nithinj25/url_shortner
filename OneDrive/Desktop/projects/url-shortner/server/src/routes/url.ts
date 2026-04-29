import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import { Url } from "../models/Url";
import { Click } from "../models/Click";
import { validateUrl } from "../middleware/validateUrl";
import { protect } from "../middleware/auth";
import {
  cacheOriginalUrlLookup,
  cacheUrl,
  getCachedShortCodeByOriginalUrl,
  invalidateUrl,
} from "../services/redis";
import { parse } from "node:path";
import { promiseHooks } from "node:v8";
import { stringify } from "node:querystring";
import { error } from "node:console";

const router = Router();

interface ShortenRequestBody {
  originalUrl: string;
  customAlias?: string;
  expiresInDays?: number;
}

// ─────────────────────────────────────────
// POST /api/url/shorten
// ─────────────────────────────────────────
router.post(
  "/shorten",
  protect,
  validateUrl,
  async (
    req: Request<{}, {}, ShortenRequestBody>,
    res: Response
  ): Promise<void> => {
    const { originalUrl, customAlias, expiresInDays } = req.body;

    if(customAlias && !/^[a-zA-Z0-9_-]+$/.test(customAlias)){
      res.status(400).json({ success: false, error: "Alias can only contain letters, numbers, hyphens and underscores"});
      return ;
    }

    if(expiresInDays && expiresInDays > 365){
      res.status(400).json({ success: false, error: "Expiry cannot excedd 365 days"});
      return;
    }

    const ownerId = req.user!.userId;

    try {
      if (!customAlias) {
        const cachedShortCode = await getCachedShortCodeByOriginalUrl(ownerId, originalUrl);
        if (cachedShortCode) {
          const cachedExistingUrl = await Url.findOne({
            owner: ownerId,
            shortCode: cachedShortCode,
          });

          if (cachedExistingUrl) {
            res.status(200).json({ success: true, data: cachedExistingUrl });
            return;
          }
        }

        const existingOriginalUrl = await Url.findOne({
          owner: ownerId,
          originalUrl,
          isActive: true,
        }).sort({ createdAt: -1 });

        if (existingOriginalUrl) {
          await Promise.all([
            cacheOriginalUrlLookup(ownerId, originalUrl, existingOriginalUrl.shortCode),
            cacheUrl(existingOriginalUrl.shortCode, existingOriginalUrl.originalUrl),
          ]);

          res.status(200).json({ success: true, data: existingOriginalUrl });
          return;
        }
      }

      const shortCode = customAlias || nanoid(7);

      const existing = await Url.findOne({ shortCode });
      if (existing) {
        res.status(409).json({ success: false, error: "Alias already taken" });
        return;
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const payload: {
        originalUrl: string;
        shortCode: string;
        owner: string;
        expiresAt: Date | null;
        customAlias?: string;
      } = {
        originalUrl,
        shortCode,
        owner: ownerId,
        expiresAt,
      };

      if (customAlias) {
        payload.customAlias = customAlias;
      }

      const newUrl = await Url.create(payload);

      await Promise.all([
        cacheUrl(newUrl.shortCode, newUrl.originalUrl),
        cacheOriginalUrlLookup(ownerId, newUrl.originalUrl, newUrl.shortCode),
      ]);

      res.status(201).json({ success: true, data: newUrl });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        res.status(409).json({ success: false, error: "Alias already taken" });
        return;
      }
      console.error("Shorten error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ─────────────────────────────────────────
// GET /api/url/all
// ─────────────────────────────────────────
router.get(
  "/all",
  protect,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1)* limit;

      const ownerId = req.user!.userId;

      const [urls, total] = await Promise.all([
        Url.find({ owner: ownerId})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        Url.countDocuments({ owner: ownerId}),
      ]);

      res.status(200).json({
        success: true,
        data: urls,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total/limit),
          hasNextPage: page < Math.ceil(total / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ─────────────────────────────────────────
// GET /api/url/:id/stats
// Quick stats for one URL — total clicks,
// top country, top device, last clicked
// 📚 LEARN: This uses Promise.all to run
// multiple DB queries at the same time
// instead of one after another
// ─────────────────────────────────────────
router.get(
  "/:id/stats",
  protect,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const urlId = new mongoose.Types.ObjectId(req.params.id);
      const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

      // First check URL exists and belongs to this user
      const url = await Url.findOne({ _id: urlId, owner: ownerId });
      if (!url) {
        res.status(404).json({ success: false, error: "URL not found" });
        return;
      }

      // 📚 LEARN: Run all 4 queries in parallel with Promise.all
      // Total time = slowest single query, not sum of all queries
      const [totalClicks, topCountry, topDevice, lastClick] = await Promise.all([

        // 1. Total click count for this URL
        Click.countDocuments({ urlId }),

        // 2. Top country — which country clicked the most?
        Click.aggregate([
          { $match: { urlId, owner: ownerId } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),

        // 3. Top device — mobile or desktop?
        Click.aggregate([
          { $match: { urlId, owner: ownerId } },
          { $group: { _id: "$device", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),

        // 4. Most recent click timestamp
        // 📚 LEARN: findOne with sort = get the latest document
        Click.findOne({ urlId }).sort({ createdAt: -1 }).select("createdAt"),
      ]);

      res.status(200).json({
        success: true,
        data: {
          url: {
            shortCode:   url.shortCode,
            originalUrl: url.originalUrl,
            isActive:    url.isActive,
            expiresAt:   url.expiresAt,
            createdAt:   url.createdAt,
          },
          stats: {
            totalClicks,
            topCountry: topCountry[0]?._id || "N/A",
            topDevice:  topDevice[0]?._id  || "N/A",
            lastClicked: lastClick?.createdAt || null,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ─────────────────────────────────────────
// PATCH /api/url/:id/toggle
// Activate or deactivate a short URL
// 📚 LEARN: PATCH = partial update (vs PUT = full replace)
// We're only changing isActive, not the whole document
// ─────────────────────────────────────────
router.patch(
  "/:id/toggle",
  protect,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const url = await Url.findOne({
        _id: req.params.id,
        owner: req.user!.userId,
      });

      if (!url) {
        res.status(404).json({ success: false, error: "URL not found" });
        return;
      }

      // Flip the current value
      url.isActive = !url.isActive;
      await url.save();

      res.status(200).json({
        success: true,
        data: { isActive: url.isActive },
        message: `URL ${url.isActive ? "activated" : "deactivated"}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// ─────────────────────────────────────────
// DELETE /api/url/:id
// ─────────────────────────────────────────
router.delete(
  "/:id",
  protect,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const url = await Url.findOne({
        _id: req.params.id,
        owner: req.user!.userId,
      });

      if (!url) {
        res.status(404).json({ success: false, error: "URL not found" });
        return;
      }

      // 📚 LEARN: Also delete all click records for this URL
      // Otherwise you leave orphaned data in the clicks collection
      await Promise.all([
        url.deleteOne(),
        Click.deleteMany({ urlId: url._id }),
      ]);

      res.status(200).json({ success: true, message: "Deleted" });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

//for editing the url
router.patch(
  "/:id" ,
  protect,
  async (req: Request<{id: string}>, res: Response): Promise<void> => {
    try{
      const url = await Url.findOne({
        _id: req.params.id,
        owner: req.user!.userId,
      });

      if(!url){
        res.status(404).json({ success: false, error: "Url not found" });
        return;
      }

      const { originalUrl, customAlias } = req.body;

      if(originalUrl){
        try{
          new URL(originalUrl);
        } catch{
          res.status(400).json({ success: false, error: "invalid url format. include the requried format"})
          return;
        }

        await invalidateUrl(url.shortCode);
        url.originalUrl = originalUrl;
      }

      if (customAlias) {
        if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
          res.status(400).json({ success: false, error: "Alias can only contain letters, numbers, hyphens and underscores" });
          return;
        }
        url.customAlias = customAlias;
      }

      await url.save();
      res.status(200).json({ success: true, data: url });

    } catch (err){
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
)

export default router;