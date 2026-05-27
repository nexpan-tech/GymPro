import { Router } from "express";
import { LeadController } from "./lead.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", LeadController.create);
router.get("/", LeadController.getAll);

router.get("/analytics/funnel", LeadController.funnelAnalytics);

router.get("/:id", LeadController.getById);
router.put("/:id", LeadController.update);
router.delete("/:id", LeadController.remove);
router.post("/automation/follow-ups", LeadController.processFollowUps);

export default router;