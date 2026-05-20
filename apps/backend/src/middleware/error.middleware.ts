import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { Sentry } from "../config/sentry";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || err.status || 500;

  logger.error("Server Error", {
    message: err.message,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: err.stack,
  });

  if (statusCode >= 500) {
    Sentry.captureException(err);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Request failed",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
};