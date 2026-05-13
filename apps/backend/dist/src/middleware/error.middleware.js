"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const logger_1 = require("../config/logger");
const errorMiddleware = (err, req, res, next) => {
    logger_1.logger.error("🔥 Server Error:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorMiddleware = errorMiddleware;
