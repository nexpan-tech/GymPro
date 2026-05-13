import { Router } from "express";
import * as controller from "./workout.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { validate } from "../../middleware/validate.middleware";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
} from "./workout.validation";

const router = Router();

router.use(authMiddleware);

// Trainer + Admin can create/update plans
router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  validate(createWorkoutSchema),
  controller.createWorkoutPlan
);

router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  controller.getWorkoutPlans
);

router.get(
  "/member/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  controller.getWorkoutPlanByMember
);

router.put(
  "/member/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  validate(updateWorkoutSchema),
  controller.updateWorkoutPlan
);

export default router;