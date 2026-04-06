import jwt, { type SignOptions } from "jsonwebtoken";
import { IUserDocument } from "../models/User";

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

export interface RefreshTokenPayload {
    userId: string;
}

export const generateAccessToken = (user: IUserDocument) : string => {
    const payload: AccessTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
    };

    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"],
    });
};

export const generateRefreshToken = (user: IUserDocument): string => {
  const payload: RefreshTokenPayload = {
    userId: user._id.toString(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as AccessTokenPayload;
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as RefreshTokenPayload;
}