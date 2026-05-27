import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { ScalabilityController } from "./scalability.controller";

const router = Router();

router.use(authMiddleware);

router.get("/health", ScalabilityController.health);
router.get("/queue", ScalabilityController.queueStatus);
router.post("/cache/clear", ScalabilityController.clearCache);

export default router;