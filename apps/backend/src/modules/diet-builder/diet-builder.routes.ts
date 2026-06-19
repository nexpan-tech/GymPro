import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { DietBuilderController } from "./diet-builder.controller";

const router = Router();

router.use(authMiddleware);

// Reading plans is role-scoped inside the service (member → own, trainer →
// assigned). Mutations are staff-only.
router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  DietBuilderController.getPlans
);
router.get(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  DietBuilderController.getPlanById
);

router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.createPlan
);
router.post(
  "/:dietPlanId/meals",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.addMeal
);
router.put(
  "/meals/:mealId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.updateMeal
);
router.delete(
  "/meals/:mealId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.deleteMeal
);

// Plan-level edit / delete. Trainer → assigned members only (enforced in the
// service). The two-segment "/meals/..." routes above never collide with the
// single-segment "/:id" matcher.
router.put(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.updatePlan
);
router.delete(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  DietBuilderController.deletePlan
);

export default router;
