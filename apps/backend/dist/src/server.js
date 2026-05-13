"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./config/logger");
/**
 * PORT
 */
const PORT = process.env.PORT || 5000;
/**
 * START SERVER
 */
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info(`🚀 GymPro API running on port ${PORT}`);
    logger_1.logger.info(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});
/**
 * GRACEFUL SHUTDOWN
 */
process.on("SIGTERM", () => {
    logger_1.logger.warn("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        logger_1.logger.info("Process terminated");
    });
});
process.on("SIGINT", () => {
    logger_1.logger.warn("SIGINT received. Shutting down gracefully...");
    server.close(() => {
        logger_1.logger.info("Process terminated");
    });
});
