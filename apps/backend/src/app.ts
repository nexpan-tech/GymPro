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

const app = express();

/**
 * ----------------------------
 * GLOBAL MIDDLEWARES
 * ----------------------------
 */
app.use(
  cors({
    origin: "http://localhost:5173", // Update this to your frontend URL
    credentials: true,
  })
);
app.use(helmet());
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

/**
 * ----------------------------
 * ERROR HANDLER (LAST)
 * ----------------------------
 */
app.use(errorMiddleware);

export default app;