import { Request, Response, NextFunction } from "express";

export const validateUrl = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { originalUrl } = req.body;

    if(!originalUrl || typeof originalUrl !== "string"){
        res.status(400).json({ success: false, error: "URL is required "});
        return;
    }

    try{
        new URL(originalUrl);
        next();
    } catch{
        res.status(400).json({ success: false, error: "Invalid Url format. Include https://"})
    }
}
