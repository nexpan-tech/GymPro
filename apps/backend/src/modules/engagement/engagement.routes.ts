import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { EngagementController } from "./engagement.controller";

const router = Router();

router.use(authMiddleware);

router.get("/attendance/me", EngagementController.getMyAttendanceEngagement);
router.get("/attendance/member/:memberId", EngagementController.getAttendanceEngagement);
router.get("/low-members", EngagementController.getLowEngagementMembers);
router.get("/churn-risk", EngagementController.getChurnRiskMembers);
router.get("/attendance-drop", EngagementController.getAttendanceDropMembers);
router.post("/encouragement", EngagementController.sendEncouragement);
router.get("/workout-streaks", EngagementController.getWorkoutStreaks);

export default router;