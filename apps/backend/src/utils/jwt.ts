import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export type AuthRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "RECEPTIONIST"
  | "TRAINER"
  | "MEMBER";

export type JwtPayload = {
  id: string;
  email: string;
  role: AuthRole;
  gymId: string | null;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

// temporary backward compatibility
export const generateToken = generateAccessToken;