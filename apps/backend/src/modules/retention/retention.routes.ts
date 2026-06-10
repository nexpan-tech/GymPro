import { Router } from "express";
import * as controller from "./retention.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);

// Gym staff retention/churn views.
const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN];

router.get("/platform", roleMiddleware([ROLES.SUPER_ADMIN]), controller.platform);
router.get("/overview", roleMiddleware([...STAFF, ROLES.TRAINER]), controller.overview);
router.get("/members", roleMiddleware(STAFF), controller.memberRisk);
router.get("/churn", roleMiddleware(STAFF), controller.churn);
router.get("/predictions", roleMiddleware(STAFF), controller.predictions);

// Trainer-scoped: only members assigned to the calling trainer.
router.get("/trainer/my", roleMiddleware([ROLES.TRAINER, ROLES.ADMIN]), controller.trainerRisk);

router.post("/recompute", roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]), controller.recompute);

export default router;
