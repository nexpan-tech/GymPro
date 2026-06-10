import { Router } from "express";
import * as controller from "./feature-flag.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);

// Any gym staff/member can read their gym's effective flags (UI gating).
router.get("/me", controller.myFlags);

// Super-admin management.
const SA = roleMiddleware([ROLES.SUPER_ADMIN]);
router.get("/catalogue", SA, controller.catalogue);
router.post("/seed", SA, controller.seed);
router.get("/gym/:gymId", SA, controller.gymFlags);
router.put("/gym/:gymId", SA, controller.setFlag);

export default router;
