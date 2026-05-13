import { Router } from "express";
import { GymController } from "./gym.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * SUPER ADMIN ONLY ROUTES
 * This is your SaaS control plane
 */

router.post(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.create
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.getAll
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  GymController.getById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.update
);

router.patch(
  "/:id/activate",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.activate
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.deactivate
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  GymController.delete
);

export default router;