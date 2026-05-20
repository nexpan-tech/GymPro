import { Request, Response, NextFunction, RequestHandler } from "express";
import { Role } from "@prisma/client";

export const requireRoles = (...roles: Role[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    next();
  };
};

/**
 * Backward compatible old middleware name.
 * Supports:
 * roleMiddleware([ROLES.ADMIN])
 * roleMiddleware([ROLES.ADMIN, ROLES.TRAINER])
 */
export const roleMiddleware = (roles: Role[]): RequestHandler => {
  return requireRoles(...roles);
};

