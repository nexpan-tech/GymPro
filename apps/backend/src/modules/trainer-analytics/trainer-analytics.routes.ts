import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { TrainerAnalyticsController } from "./trainer-analytics.controller";

const router = Router();

router.use(authMiddleware);

router.get("/overview", TrainerAnalyticsController.getOverview);
router.get("/leaderboard", TrainerAnalyticsController.getLeaderboard);
// Self stats for the logged-in trainer. MUST be declared before the dynamic
// "/:trainerId" route so "stats" is not captured as a trainerId param.
router.get("/stats", TrainerAnalyticsController.getMyStats);
router.get("/:trainerId", TrainerAnalyticsController.getTrainerDetail);

export default router;