import { Request, Response, NextFunction } from "express";

/**
 * Wrap async route handlers
 * Avoids repetitive try/catch blocks
 */
export const asyncHandler =
  (fn: Function) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };