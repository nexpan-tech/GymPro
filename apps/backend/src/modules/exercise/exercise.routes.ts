import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { ExerciseController } from "./exercise.controller";

const router = Router();

router.use(authMiddleware);

// Library is readable by any authenticated role (members view exercise detail).
router.get("/", ExerciseController.getAll);
router.get("/:id", ExerciseController.getById);

// Mutations restricted to staff. SUPER_ADMIN manages the shared public library.
router.post(
  "/",
  roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TRAINER]),
  ExerciseController.create
);
router.put(
  "/:id",
  roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TRAINER]),
  ExerciseController.update
);
router.delete(
  "/:id",
  roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TRAINER]),
  ExerciseController.delete
);

export default router;
