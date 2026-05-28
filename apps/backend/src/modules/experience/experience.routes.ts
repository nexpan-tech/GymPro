import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { ExperienceController } from "./experience.controller";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard/:memberId", ExperienceController.dashboard);
router.get("/recommendations/:memberId", ExperienceController.recommendations);

export default router;