import { Router } from "express";
import { MembershipController } from "./membership.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * Billing & Membership system
 */

router.post(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.create
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  MembershipController.getAll
);

router.get(
  "/member/:memberId",
  authMiddleware,
  roleMiddleware([
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.TRAINER,
  ]),
  MembershipController.getByMember
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  MembershipController.update
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  MembershipController.delete
);

export default router;