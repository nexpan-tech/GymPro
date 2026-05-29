import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import { httpRequestCounter } from "./monitoring/metrics";

import healthRoutes from "./modules/health/health.routes";
import authRoutes from "./modules/auth/auth.routes";
import gymRoutes from "./modules/gym/gym.routes";
import userRoutes from "./modules/user/user.routes";
import memberRoutes from "./modules/member/member.routes";
import trainerRoutes from "./modules/trainer-analytics/trainer-analytics.routes";
import workoutRoutes from "./modules/workout/workout.routes";
import dietRoutes from "./modules/diet/diet.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import membershipRoutes from "./modules/membership/membership.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import progressRoutes from "./modules/progress/progress.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import automationRoutes from "./modules/automation/automation.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import communicationRoutes from "./modules/communication/communication.routes";
import goalRoutes from "./modules/goal/goal.routes";
import badgeRoutes from "./modules/badge/badge.routes";
import transformationRoutes from "./modules/transformation/transformation.routes";
import engagementRoutes from "./modules/engagement/engagement.routes";
import dueRoutes from "./modules/due/due.routes";
import trainerAnalyticsRoutes from "./modules/trainer-analytics/trainer-analytics.routes";
import exerciseRoutes from "./modules/exercise/exercise.routes";
import dietBuilderRoutes from "./modules/diet-builder/diet-builder.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import intelligenceRoutes from "./modules/intelligence/intelligence.routes";
import leadRoutes from "./modules/lead/lead.routes";
import campaignRoutes from "./modules/campaign/campaign.routes";
import branchRoutes from "./modules/branch/branch.routes";
import scalabilityRoutes from "./modules/scalability/scalability.routes";
import communityRoutes from "./modules/community/community.routes";
import gamificationRoutes from "./modules/gamification/gamification.routes";
import experienceRoutes from "./modules/experience/experience.routes";
import billingRoutes from "./modules/billing/billing.routes";
import whiteLabelRoutes from "./modules/white-label/white-label.routes";
import marketplaceRoutes from "./modules/marketplace/marketplace.routes";
import apiPlatformRoutes from "./modules/api-platform/api-platform.routes";

import auditRoutes from "./modules/audit/audit.routes";
import { auditMiddleware } from "./modules/audit/audit.middleware";

const app = express();

/**
 * Trust proxy is needed when running behind Nginx / load balancer.
 */
app.set("trust proxy", 1);

/**
 * Core security middleware
 */
app.use(helmet());

/**
 * CORS
 */
app.use(
  cors({
   origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

/**
 * Body parsers
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(auditMiddleware);

/**
 * HTTP logging
 */
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

/**
 * Production rate limiter
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  })
);

/**
 * Prometheus request counter
 */
app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: String(res.statusCode),
    });
  });

  next();
});

/**
 * Basic root endpoint
 */
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "GymPro API is running",
    version: "1.0.0",
  });
});

/**
 * Health endpoints should stay public and early.
 */
app.use("/api/v1/health", healthRoutes);
app.use("/api/health", healthRoutes);

/**
 * API v1 routes
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/gyms", gymRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/members", memberRoutes);
app.use("/api/v1/trainers", trainerRoutes);
app.use("/api/v1/workouts", workoutRoutes);
app.use("/api/v1/diets", dietRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/memberships", membershipRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/automation", automationRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/communication", communicationRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/badges", badgeRoutes);
app.use("/api/v1/transformations", transformationRoutes);
app.use("/api/v1/engagement", engagementRoutes);
app.use("/api/v1/dues", dueRoutes);
app.use("/api/v1/trainer-analytics", trainerAnalyticsRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/diet-builder", dietBuilderRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/intelligence", intelligenceRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/branches", branchRoutes);
app.use("/api/v1/scalability", scalabilityRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/gamification", gamificationRoutes);
app.use("/api/v1/experience", experienceRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/white-label", whiteLabelRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);
app.use("/api/v1/api-platform", apiPlatformRoutes);
app.use("/api/v1/audit", auditRoutes);

/**
 * Legacy / shorter API aliases
 */
app.use("/api/auth", authRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/users", userRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/diets", dietRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/transformations", transformationRoutes);
app.use("/api/engagement", engagementRoutes);
app.use("/api/dues", dueRoutes);
app.use("/api/trainer-analytics", trainerAnalyticsRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/diet-builder", dietBuilderRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/scalability", scalabilityRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/white-label", whiteLabelRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/api-platform", apiPlatformRoutes);
app.use("/api/audit", auditRoutes);
/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Global error handler must be last.
 */
app.use(errorMiddleware);

export default app;