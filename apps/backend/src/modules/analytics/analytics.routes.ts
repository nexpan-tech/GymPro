import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["ADMIN", "RECEPTIONIST", "TRAINER"]),
  analyticsController.getDashboard.bind(analyticsController)
);

// Revenue chart
router.get(
  "/revenue-chart",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  analyticsController.getRevenueChart.bind(analyticsController)
);

// Membership distribution
router.get(
  "/membership-distribution",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  analyticsController.getMembershipDistribution.bind(analyticsController)
);

// Gym overview
router.get(
  "/gym-overview",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  analyticsController.getGymOverview.bind(analyticsController)
);

export default router;