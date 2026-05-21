import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./config/logger";
import "./jobs/notification.job";
import "./jobs/renewalReminder.job";
import { startSchedulers } from "./jobs/scheduler";


/**
 * PORT
 */
const PORT = process.env.PORT || 5000;
import { initSentry } from "./config/sentry";
initSentry();
/**
 * START SERVER
 */
const server = app.listen(PORT, () => {
  logger.info(`🚀 GymPro API running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  startSchedulers();
});

/**
 * GRACEFUL SHUTDOWN
 */
process.on("SIGTERM", () => {
  logger.warn("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated");
  });
});

process.on("SIGINT", () => {
  logger.warn("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated");
  });
});