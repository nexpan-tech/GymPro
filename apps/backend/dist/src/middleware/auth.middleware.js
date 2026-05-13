"use strict";
// src/middleware/auth.middleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
/**
 * JWT Authentication Middleware
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authorization token is missing",
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            gymId: decoded.gymId ?? null,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error("Authentication failed:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
exports.authMiddleware = authMiddleware;
