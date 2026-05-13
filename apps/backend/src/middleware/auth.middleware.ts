// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Authenticated user attached to req.user
 */
export interface AuthUser {
  id: string;
  email?: string;
  role: Role;
  gymId: string | null;
}

/**
 * Exported AuthRequest type
 * Use this in controllers/middleware:
 * (req: AuthRequest, res: Response)
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Extend Express globally so req.user works everywhere
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token is missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
      id: string;
      email?: string;
      role: Role;
      gymId?: string | null;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      gymId: decoded.gymId ?? null,
    };

    next();
  } catch (error) {
    logger.error("Authentication failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};