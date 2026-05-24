import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { IntelligenceController } from "./intelligence.controller";

const router = Router();

router.use(authMiddleware);

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