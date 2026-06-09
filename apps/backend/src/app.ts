import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorMiddleware } from "./middleware/error.middleware";
import { metricsMiddleware } from "./middleware/metrics.middleware";

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
import pushRoutes from "./modules/push/push.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import automationRoutes from "./modules/automation/automation.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import communicationRoutes from "./modules/communication/communication.routes";
import goalRoutes from "./modules/goal/goal.routes";
import badgeRoutes from "./modules/badge/badge.routes";
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
import deviceSessionRoutes from "./modules/device-sessions/device-session.routes";
import qrAttendanceRoutes from "./modules/qr-attendance/qr-attendance.routes";
import mobileRoutes from "./modules/mobile/mobile.routes";

import auditRoutes from "./modules/audit/audit.routes";
import { auditMiddleware } from "./modules/audit/audit.middleware"
import { Sentry } from "./config/sentry";
import { uploadLimiter } from './middleware/rateLimits'
import { requestIdMiddleware } from './middleware/requestId.middleware'

const app = express();

/**
 * Trust proxy is needed when running behind Nginx / load balancer.
 */
app.set("trust proxy", 1);

/**
 * Core security middleware
 */
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS
 */
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(function(o) { return o.trim() }).filter(Boolean)
app.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    const isDev = process.env.NODE_ENV !== 'production'
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin)
    if (allowedOrigins.includes(origin) || (isDev && isLocalhost)) return callback(null, true)
    callback(new Error('CORS: origin not allowed'))
  }
}))

/**
 * Body parsers
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Attach a unique request ID to every request for tracing.
 */
app.use(requestIdMiddleware);

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
    // A single-page app fires many calls per screen (made worse by React
    // StrictMode double-invokes in dev), so 300/15min throttled normal usage
    // and bounced users to /login. Keep a sane production cap but a generous
    // dev cap.
    max: process.env.NODE_ENV === "production" ? 1000 : 10_000,
    standardHeaders: true,
    legacyHeaders: false,
    // Never rate-limit health checks or CORS preflights.
    skip: (req) =>
      req.method === "OPTIONS" || req.path.startsWith("/api/v1/health"),
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  })
);

/**
 * Prometheus metrics middleware
 */
app.use(metricsMiddleware);

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
// NOTE: the brute-force/auth rate limiter is applied per-route inside
// auth.routes (login/register only). It must NOT cover /auth/me, /auth/refresh
// or /auth/logout — those are normal authenticated calls and throttling them
// caused 429 loops on boot (StrictMode double-mount + reloads).
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
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/automation", automationRoutes);
app.use("/api/v1/uploads", uploadLimiter, uploadRoutes);
app.use("/api/v1/communication", communicationRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/badges", badgeRoutes);
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
app.use("/api/v1/device-sessions", deviceSessionRoutes);
app.use("/api/v1/qr-attendance", qrAttendanceRoutes);
app.use("/api/v1/mobile", mobileRoutes);

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
Sentry.setupExpressErrorHandler(app);
app.use(errorMiddleware);

export default app;
