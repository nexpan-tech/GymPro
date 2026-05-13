"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = exports.AppError = void 0;
/**
 * Custom error class for application errors
 */
class AppError extends Error {
    message;
    statusCode;
    data;
    constructor(message, statusCode = 500, data) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
/**
 * Success response helper
 */
const successResponse = (res, message, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.successResponse = successResponse;
/**
 * Error response helper
 */
const errorResponse = (res, message, statusCode = 400, data) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data,
    });
};
exports.errorResponse = errorResponse;
