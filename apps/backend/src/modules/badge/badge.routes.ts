import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { BadgeController } from "./badge.controller";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];
const STAFF_TRAINER = [...STAFF, ROLES.TRAINER];

// Catalogue management + awarding (staff).
router.post("/", roleMiddleware(STAFF), BadgeController.createBadge);
router.get("/", roleMiddleware([...STAFF_TRAINER, ROLES.MEMBER]), BadgeController.getBadges);
router.post("/award", roleMiddleware(STAFF_TRAINER), BadgeController.awardBadge);

// Member self-service — before "/member/:memberId".
router.get("/me", roleMiddleware([ROLES.MEMBER, ...STAFF_TRAINER]), BadgeController.getMyBadges);

router.get("/member/:memberId", roleMiddleware(STAFF_TRAINER), BadgeController.getMemberBadges);
router.post("/auto/goal/:memberId", roleMiddleware(STAFF_TRAINER), BadgeController.autoAwardGoalBadge);
router.post("/auto/attendance/:memberId", roleMiddleware(STAFF_TRAINER), BadgeController.autoAwardAttendanceBadge);

export default router;
