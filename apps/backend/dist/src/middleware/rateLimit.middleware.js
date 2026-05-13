"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Global API rate limiter
 */
exports.rateLimitMiddleware = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200, // limit per IP
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
