import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { errorMiddleware } from "./middleware/error.middleware";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import gymRoutes from "./modules/gym/gym.routes";
import memberRoutes from "./modules/member/member.routes";
import membershipRoutes from "./modules/membership/membership.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import dietRoutes from "./modules/diet/diet.routes";
import workoutRoutes from "./modules/workout/workout.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import { rateLimitMiddleware } from "./middleware/rateLimit.middleware";
import automationRoutes from "./modules/automation/automation.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import dueRoutes from "./modules/due/due.routes";
import deviceRoutes from "./modules/device/device.routes";
import progressRoutes from "./modules/progress/progress.routes";
import goalRoutes from "./modules/goal/goal.routes";
import engagementRoutes from "./modules/engagement/engagement.routes";
import badgeRoutes from "./modules/badge/badge.routes";
import transformationRoutes from "./modules/transformation/transformation.routes";

const app = express();

/**
 * ----------------------------
 * GLOBAL MIDDLEWARES
 * ----------------------------
 */
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8081"], // Update this to your frontend URL
    credentials: true,
  })
);
app.use(helmet());
app.use(rateLimitMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

/**
 * ----------------------------
 * HEALTH CHECK
 * ----------------------------
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    service: "GymPro API",
    timestamp: new Date().toISOString(),
  });
});

/**
 * ----------------------------
 * API ROUTES
 * ----------------------------
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/gyms", gymRoutes);

app.use("/api/v1/members", memberRoutes);
app.use("/api/v1/memberships", membershipRoutes);
app.use("/api/v1/attendance", attendanceRoutes);

app.use("/api/v1/diet-plans", dietRoutes);
app.use("/api/v1/workout-plans", workoutRoutes);

app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/automation", automationRoutes);

app.use("/api/v1/uploads", uploadRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/diet-plans", dietRoutes);
app.use("/api/workout-plans", workoutRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/v1/dues", dueRoutes);
app.use("/api/dues", dueRoutes);

app.use("/api/v1/devices", deviceRoutes);
app.use("/api/devices", deviceRoutes);

app.use("/api/v1/progress", progressRoutes);
app.use("/api/progress", progressRoutes);

app.use("/api/v1/goals", goalRoutes);
app.use("/api/goals", goalRoutes);

app.use("/api/v1/engagement", engagementRoutes);
app.use("/api/engagement", engagementRoutes);

app.use("/api/v1/badges", badgeRoutes);
app.use("/api/badges", badgeRoutes);

app.use("/api/v1/transformations", transformationRoutes);
app.use("/api/transformations", transformationRoutes);
/**
 * ----------------------------
 * ERROR HANDLER (LAST)
 * ----------------------------
 */
app.use(errorMiddleware);

export default app;

