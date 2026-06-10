import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * Notifications = Automation layer
 */

router.post(
  "/",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.TRAINER,
  ]),
  NotificationController.create
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  NotificationController.getAll
);

// ── Stage 9 — member self-service (static paths before "/:id" + "/member") ──
router.get("/me", authMiddleware, roleMiddleware([ROLES.MEMBER]), NotificationController.listMine);
router.patch("/read-all", authMiddleware, roleMiddleware([ROLES.MEMBER]), NotificationController.markAllRead);
router.patch("/:id/read", authMiddleware, roleMiddleware([ROLES.MEMBER]), NotificationController.markRead);

router.get(
  "/member/:memberId",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.TRAINER,
    ROLES.RECEPTIONIST,
  ]),
  NotificationController.getByMember
);

router.patch(
  "/:id/sent",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
  ]),
  NotificationController.markSent
);

export default router;