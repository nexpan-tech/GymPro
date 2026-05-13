import { Router } from "express";
import { DietController } from "./diet.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * Trainers + Admin can manage diet plans
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietController.create
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietController.getAll
);

router.get(
  "/:memberId",
  authMiddleware,
  DietController.getByMember
);

router.put(
  "/:memberId",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietController.update
);

router.delete(
  "/:memberId",
  authMiddleware,
  roleMiddleware([ROLES.ADMIN]),
  DietController.delete
);

export default router;