import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { TrainerAnalyticsController } from "./trainer-analytics.controller";

const router = Router();

router.use(authMiddleware);

router.get("/overview", TrainerAnalyticsController.getOverview);
router.get("/leaderboard", TrainerAnalyticsController.getLeaderboard);
router.get("/:trainerId", TrainerAnalyticsController.getTrainerDetail);

export default router;