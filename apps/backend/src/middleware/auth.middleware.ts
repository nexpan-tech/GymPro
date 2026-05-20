import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import { logger } from "../config/logger";

export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token is missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      gymId: decoded.gymId,
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

