import { Router } from "express";
import * as controller from "./ai.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { requireFeature } from "../../middleware/requireFeature";

const router = Router();

router.use(authMiddleware);
// Stage 10 — the whole AI surface is gated by the per-gym "ai" feature flag
// (default ON; super-admin can disable per gym).
router.use(requireFeature("ai"));

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];

// Member self-service AI.
router.get("/me/recommendations", roleMiddleware([ROLES.MEMBER, ...STAFF, ROLES.TRAINER]), controller.myRecommendations);
router.get("/me/nudges", roleMiddleware([ROLES.MEMBER, ...STAFF, ROLES.TRAINER]), controller.myNudges);

// Staff AI.
router.get("/members/:memberId/recommendations", roleMiddleware([...STAFF, ROLES.TRAINER]), controller.memberRecommendations);
router.get("/forecast", roleMiddleware(STAFF), controller.forecast);
router.get("/insights", roleMiddleware(STAFF), controller.insights);

export default router;
