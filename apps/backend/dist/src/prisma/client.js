"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["error"],
    });
/**
 * Attach to global in dev to avoid reconnecting on hot reload
 */
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
/**
 * Graceful shutdown handling
 * Important for SaaS stability
 */
const disconnect = async (signal) => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info(`🛑 Prisma disconnected due to ${signal}`);
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error("❌ Error during Prisma disconnect", err);
        process.exit(1);
    }
};
process.on("SIGINT", () => disconnect("SIGINT"));
process.on("SIGTERM", () => disconnect("SIGTERM"));
