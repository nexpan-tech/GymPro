import { Router } from "express";
import * as controller from "./announcement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { broadcastLimiter } from "../../middleware/rateLimits";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];

// Member-facing — static paths before "/:id".
router.get("/me", roleMiddleware([ROLES.MEMBER, ROLES.TRAINER, ...STAFF]), controller.listMine);
router.patch("/:id/read", roleMiddleware([ROLES.MEMBER, ROLES.TRAINER, ...STAFF]), controller.markRead);

// Admin management.
router.post("/", roleMiddleware(STAFF), controller.create);
router.get("/", roleMiddleware(STAFF), controller.list);
router.get("/:id", roleMiddleware(STAFF), controller.getById);
router.put("/:id", roleMiddleware(STAFF), controller.update);
router.post("/:id/send", broadcastLimiter, roleMiddleware(STAFF), controller.send);
router.post("/:id/cancel", roleMiddleware(STAFF), controller.cancel);

export default router;
