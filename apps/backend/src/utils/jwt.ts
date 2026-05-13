import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  id: string;
  role: string;
  gymId?: string | null;
};

/**
 * Generate JWT Token
 */
export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Verify JWT Token
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};