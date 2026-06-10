import { Router } from "express";
import { LeadController } from "./lead.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);
// CRM is a front-desk / management function — never exposed to members/trainers.
router.use(roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]));

router.post("/", LeadController.create);
router.get("/", LeadController.getAll);

// Static paths before "/:id".
router.get("/analytics/funnel", LeadController.funnelAnalytics);
router.post("/automation/follow-ups", LeadController.processFollowUps);

router.get("/:id", LeadController.getById);
router.put("/:id", LeadController.update);
router.delete("/:id", LeadController.remove);

// Stage 7 — CRM activity log + pipeline transitions.
router.get("/:id/activities", LeadController.getActivities);
router.post("/:id/activities", LeadController.addActivity);
router.patch("/:id/status", LeadController.changeStatus);

export default router;
