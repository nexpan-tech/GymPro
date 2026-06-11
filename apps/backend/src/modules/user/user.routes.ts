import { Router } from "express";
import * as controller from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { validate } from "../../middleware/validate.middleware";
import { createUserSchema, updateUserSchema } from "./user.validation";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware([ROLES.ADMIN]),
  validate(createUserSchema),
  controller.createUser
);

router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  controller.getUsers
);

router.get(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  controller.getUserById
);

router.put(
  "/:id",
  roleMiddleware([ROLES.ADMIN]),
  validate(updateUserSchema),
  controller.updateUser
);

router.post(
  "/:id/reset-password",
  roleMiddleware([ROLES.ADMIN]),
  controller.resetUserPassword
);

router.delete(
  "/:id",
  roleMiddleware([ROLES.ADMIN]),
  controller.deleteUser
);

export default router;