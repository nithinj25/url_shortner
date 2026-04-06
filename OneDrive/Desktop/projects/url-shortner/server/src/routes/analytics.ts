import { Router, Request, Response} from "express";
import mongoose from "mongoose";
import { Click } from "../models/Click";
import { Url } from "../models/Url";
import { protect } from "../middleware/auth";

const router = Router();

router.get(
    "/overview",
    protect,
    async (req: Request, res: Response): Promise<void> => {
        try{
            const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const [totalClicks, clickslast7Days, uniqueCountries, totalUrls] = 
                await Promise.all([
                    Click.countDocuments({ owner: ownerId }),

                    Click.countDocuments({ 
                        owner: ownerId,
                        createdAt: {$gte: sevenDaysAgo},
                    }),

                    Click.distinct("country", { owner: ownerId}),

                    Url.countDocuments({ owner: ownerId}),
                ]);

            res.json({
                success: true,
                data: {
                    totalClicks, 
                    clickslast7Days,
                    uniqueCountries: uniqueCountries.filter(Boolean).length,
                    totalUrls,
                },
            });
        } catch (err){
            res.status(500).json({ success: false, error: "Sever error"});
        }
    }
);


router.get(
    "/clicks",
    protect,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const ownerId = new mongoose.Types.ObjectId(req.user!.userId);
            // Instead of sending all clicks at once, return paginated results.
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const [clicks, total] = await Promise.all([
                Click.find({ owner: ownerId })
                    .sort({ createdAt: -1})
                    .skip(skip)
                    .limit(limit)
                    .populate("urlId", "shortcode originalUrl"),

                Click.countDocuments({ owner: ownerId }),
            ]);

            res.json({
                success: true,
                data: {
                    clicks,
                    paginations: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                        hasNextPage: page < Math.ceil(total / limit),
                    },
                },
            });
        } catch (err) {
            res.status(500).json({ success: false, error: "Server error"});
        }
    }
);

router.get(
    "/:urlId/clicks",
    protect,
    async (req: Request<{ urlId: string}> ,res: Response) : Promise<void> => {
        try{
            const urlId = new mongoose.Types.ObjectId(req.params.urlId);
            const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

            const url = await Url.findOne({ _id: urlId, owner: ownerId});
            if(!url){
                res.status(404).json({ success: false, error: "URL not found"});
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const [clicks, total] = await Promise.all([
                Click.find({ urlId, owner: ownerId})
                    .sort({ createdAt: -1})
                    .skip(skip)
                    .limit(limit)
                    .select("country city device brower os referrer createdAt"),

                Click.countDocuments({ urlId, owner: ownerId}),
            ]);

            res.json({
                success: true,
                data: {
                    url: {
                        shortCode: url.shortCode,
                        originalUrl : url.originalUrl,
                    },
                    clicks,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPage: Math.ceil(total/ limit),
                    },
                },
            });

        } catch (err){
            res.status(500).json({ success: false, error: "Server error" });
        }
    }
)

router.get(
  "/:urlId/timeline",
  protect,
  async (req: Request<{ urlId: string }>, res: Response): Promise<void> => {
    try {
      const urlId   = new mongoose.Types.ObjectId(req.params.urlId);
      const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

      // Verify ownership
      const url = await Url.findOne({ _id: urlId, owner: ownerId });
      if (!url) {
        res.status(404).json({ success: false, error: "URL not found" });
        return;
      }

      // 📚 LEARN: $dateToString converts a Date field into a string
      // format: "%Y-%m-%d" → "2025-03-23"
      // Then $group bundles all clicks on the same date together
      // $sum: 1 means "add 1 for each document in this group" = count
      const timeline = await Click.aggregate([
        { $match: { urlId, owner: ownerId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]);

      const formatted = timeline.map((t) => ({
        date:   t._id,
        clicks: t.clicks,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

router.get(
  "/:urlId/breakdown",
  protect,
  async (req: Request<{ urlId: string }>, res: Response): Promise<void> => {
    try {
      const urlId   = new mongoose.Types.ObjectId(req.params.urlId);
      const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

      const url = await Url.findOne({ _id: urlId, owner: ownerId });
      if (!url) {
        res.status(404).json({ success: false, error: "URL not found" });
        return;
      }

      const matchStage = { urlId, owner: ownerId };

      // 📚 LEARN: All 4 aggregations run in parallel
      // Each one groups clicks by a different field and counts them
      // Result is used directly by frontend pie/bar charts
      const [devices, browsers, countries, os] = await Promise.all([
        Click.aggregate([
          { $match: matchStage },
          { $group: { _id: "$device",  count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Click.aggregate([
          { $match: matchStage },
          { $group: { _id: "$browser", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Click.aggregate([
          { $match: matchStage },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Click.aggregate([
          { $match: matchStage },
          { $group: { _id: "$os",      count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      res.json({
        success: true,
        data: { devices, browsers, countries, os },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);


export default router;