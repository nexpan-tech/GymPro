import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { BadgeController } from "./badge.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", BadgeController.createBadge);
router.get("/", BadgeController.getBadges);
router.post("/award", BadgeController.awardBadge);
router.get("/me", BadgeController.getMyBadges);
router.get("/member/:memberId", BadgeController.getMemberBadges);
router.post("/auto/goal/:memberId", BadgeController.autoAwardGoalBadge);
router.post("/auto/attendance/:memberId", BadgeController.autoAwardAttendanceBadge);

export default router;