import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { GamificationController } from "./gamification.controller";

const router = Router();

router.use(authMiddleware);

router.post("/xp", GamificationController.addXp);
router.get("/xp/:memberId", GamificationController.getMemberXp);

router.post("/missions", GamificationController.createMission);
router.get("/missions", GamificationController.getMissions);
router.post("/missions/:id/complete", GamificationController.completeMission);

router.post("/streak", GamificationController.updateStreak);

router.post("/rewards", GamificationController.createReward);
router.get("/rewards", GamificationController.getRewards);

export default router; 