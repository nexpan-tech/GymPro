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

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  MemberController.delete
);

export default router;