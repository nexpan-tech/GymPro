import { Request, Response, NextFunction, RequestHandler } from "express";

export const gymMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  if (req.user.role === "SUPER_ADMIN") {
    next();
    return;
  }

  if (!req.user.gymId) {
    res.status(403).json({
      success: false,
      message: "Gym context missing",
    });
    return;
  }

  req.headers["x-gym-id"] = req.user.gymId;

  next();
};