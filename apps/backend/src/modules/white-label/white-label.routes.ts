import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { requireFeature } from "../../middleware/requireFeature";
import { ROLES } from "../../constants/roles";
import { WhiteLabelController } from "./white-label.controller";

const router = Router();

router.get("/public/:domain", WhiteLabelController.publicSettingsByDomain);

router.use(authMiddleware);

// Branding is managed by the gym admin; readable by gym staff. Reading is always
// allowed; CHANGING branding requires the plan's "white-label" feature
// (Professional/Enterprise). Fail-open for unlicensed gyms and non-destructive —
// existing branding persists even when the feature is disabled.
router.get("/settings", roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]), WhiteLabelController.getSettings);
router.put("/settings", roleMiddleware([ROLES.ADMIN]), requireFeature("white-label"), WhiteLabelController.upsertSettings);
router.post("/verify-domain", roleMiddleware([ROLES.ADMIN]), requireFeature("white-label"), WhiteLabelController.verifyDomain);

export default router;
