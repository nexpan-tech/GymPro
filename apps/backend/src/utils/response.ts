import { Response } from "express";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public data?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Success response helper
 */
export const successResponse = (
  res: Response,
  message: string,
  data?: any,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  data?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};