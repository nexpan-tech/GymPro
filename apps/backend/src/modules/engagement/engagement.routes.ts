import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { EngagementController } from "./engagement.controller";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN];
const STAFF_TRAINER = [...STAFF, ROLES.TRAINER];

// Member self-service — own engagement only.
router.get(
  "/attendance/me",
  roleMiddleware([ROLES.MEMBER, ...STAFF_TRAINER]),
  EngagementController.getMyAttendanceEngagement
);

// Staff / trainer analytics over other members.
router.get(
  "/attendance/member/:memberId",
  roleMiddleware(STAFF_TRAINER),
  EngagementController.getAttendanceEngagement
);
router.get("/low-members", roleMiddleware(STAFF_TRAINER), EngagementController.getLowEngagementMembers);
router.get("/churn-risk", roleMiddleware(STAFF_TRAINER), EngagementController.getChurnRiskMembers);
router.get("/attendance-drop", roleMiddleware(STAFF_TRAINER), EngagementController.getAttendanceDropMembers);
router.post("/encouragement", roleMiddleware(STAFF_TRAINER), EngagementController.sendEncouragement);
router.get("/workout-streaks", roleMiddleware(STAFF_TRAINER), EngagementController.getWorkoutStreaks);

export default router;
