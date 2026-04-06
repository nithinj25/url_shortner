import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "../services/token";
import { expectFailure } from "node:test";
import { setSourceMapsSupport } from "node:module";

declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;
        }
    }
}

export const protect = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json({ success: false, error: "No token Provided" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err){
        res.status(401).json({ success: false, error: "Invlaid or expired token" });
    }
}