import rateLimit from "express-rate-limit";

/**
 * Global API rate limiter
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // limit per IP
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});