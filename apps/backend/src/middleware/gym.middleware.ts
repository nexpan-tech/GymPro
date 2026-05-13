import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Ensures gym context is always valid
 */
export const gymMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.gymId) {
      return res.status(403).json({ message: "Gym context missing" });
    }

    // attach for easy access
    req.headers["x-gym-id"] = req.user.gymId;

    next();
  } catch (error) {
    return res.status(500).json({ message: "Gym middleware error" });
  }
};