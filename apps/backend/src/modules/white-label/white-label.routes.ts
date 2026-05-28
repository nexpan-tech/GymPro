import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { WhiteLabelController } from "./white-label.controller";

const router = Router();

router.get("/public/:domain", WhiteLabelController.publicSettingsByDomain);

router.use(authMiddleware);

router.put("/settings", WhiteLabelController.upsertSettings);
router.get("/settings", WhiteLabelController.getSettings);
router.post("/verify-domain", WhiteLabelController.verifyDomain);

export default router;