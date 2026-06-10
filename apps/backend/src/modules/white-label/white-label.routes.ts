import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { WhiteLabelController } from "./white-label.controller";

const router = Router();

router.get("/public/:domain", WhiteLabelController.publicSettingsByDomain);

router.use(authMiddleware);

// Branding is managed by the gym admin; readable by gym staff.
router.get("/settings", roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]), WhiteLabelController.getSettings);
router.put("/settings", roleMiddleware([ROLES.ADMIN]), WhiteLabelController.upsertSettings);
router.post("/verify-domain", roleMiddleware([ROLES.ADMIN]), WhiteLabelController.verifyDomain);

export default router;
