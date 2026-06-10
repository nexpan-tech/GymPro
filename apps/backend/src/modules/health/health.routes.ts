import { Router } from "express";
import { HealthController } from "./health.controller";

const router = Router();

router.get("/", HealthController.health);
router.get("/ready", HealthController.readiness);
router.get("/live", HealthController.live);
router.get("/full", HealthController.full);
router.get("/metrics", HealthController.metrics);

export default router;