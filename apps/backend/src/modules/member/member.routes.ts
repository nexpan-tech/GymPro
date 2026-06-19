import { Router } from "express";
import { MemberController } from "./member.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * ADMIN + RECEPTIONIST manage members
 * TRAINER can view only (optional later)
 */

router.post(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MemberController.create
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.TRAINER,
  ]),
  MemberController.getAll
);

// Self-service profile. Registered before "/:id" so "me" isn't treated as an
// id. Available to MEMBER (the service scopes it to the caller's own record).
router.get(
  "/me",
  authMiddleware,
  roleMiddleware([
    ROLES.MEMBER,
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.TRAINER,
  ]),
  MemberController.me
);

// Self-service attendance streak (operational-day engine; Sundays excluded).
// Registered before "/:id" so "streak" isn't treated as a member id.
router.get(
  "/streak",
  authMiddleware,
  roleMiddleware([ROLES.MEMBER]),
  MemberController.streak
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.TRAINER,
  ]),
  MemberController.getById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MemberController.update
);

router.post(
  "/:id/reset-password",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MemberController.resetPassword
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  MemberController.delete
);

export default router;