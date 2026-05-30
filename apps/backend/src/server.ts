import { initSentry, Sentry } from './config/sentry'
initSentry()

process.on('uncaughtException', function(err) {
  Sentry.captureException(err)
  console.error('Uncaught Exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', function(reason) {
  Sentry.captureException(reason)
  console.error('Unhandled Rejection:', reason)
})

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./config/logger";
import { initSocket } from "./realtime/socket";
import { initializeSystemMetrics } from "./monitoring/system.metrics";

import "./jobs/notification.job";
import "./jobs/renewalReminder.job";
import "./events/event-handlers";

import { startSchedulers } from "./jobs/scheduler";
import { startReportSchedulers } from "./jobs/report.scheduler";



/**
 * INIT SERVICES
 */
initializeSystemMetrics();

/**
 * PORT
 */
const PORT = process.env.PORT || 5000;

/**
 * START SERVER
 */
const server = app.listen(PORT, () => {
  logger.info(`🚀 GymPro API running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || "development"}`);

  initSocket(server);

  startSchedulers();
  startReportSchedulers();
});

/**
 * GRACEFUL SHUTDOWN
 */
async function shutdown(signal: string) {
  logger.warn(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.info("HTTP server closed");
    logger.info("Process terminated");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
