import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Role-based access control
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied: insufficient permissions",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Role middleware error" });
    }
  };
};