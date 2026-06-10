import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { IntelligenceController } from "./intelligence.controller";

const router = Router();

router.use(authMiddleware);
// Business intelligence is management-only.
router.use(roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN]));

router.get("/dashboard", IntelligenceController.dashboard);
router.get("/revenue", IntelligenceController.revenue);
router.get("/attendance", IntelligenceController.attendance);
router.get("/retention", IntelligenceController.retention);
router.get("/churn", IntelligenceController.churn);
router.get("/growth", IntelligenceController.growth);
router.get("/insights", IntelligenceController.insights);
router.get("/forecast", IntelligenceController.forecast);
router.get("/trainer-performance", IntelligenceController.trainerPerformance);
router.get("/engagement", IntelligenceController.engagement);

export default router;