import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { WorkoutController } from "./workout.controller";
import { WorkoutAssignmentController } from "./workout-assignment.controller";

const router = Router();

router.use(authMiddleware);

// ── Calendar-day assignment engine (Phase 1) ──────────────────────────────────
// Static, member-scoped paths registered BEFORE "/:id" so they aren't swallowed.
router.post(
  "/assign",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutAssignmentController.assign)
);
router.get(
  "/today",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutAssignmentController.today)
);
router.get(
  "/week",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutAssignmentController.week)
);
router.get(
  "/upcoming",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutAssignmentController.upcoming)
);
router.get(
  "/history",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutAssignmentController.history)
);
router.post(
  "/assignments/:id/complete",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutAssignmentController.complete)
);

// Plan management — ADMIN + TRAINER only (MEMBER can view + mark completion).
router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.createPlan)
);
router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.getPlans)
);

// Static paths registered before "/:id" so they are not swallowed by it.
router.get(
  "/my",
  roleMiddleware([ROLES.MEMBER]),
  asyncHandler(WorkoutController.getMyPlans)
);
router.get(
  "/analytics",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.getAnalytics)
);
router.get(
  "/member/:memberId",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.getByMember)
);
router.post(
  "/complete",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.completeWorkout)
);

router.get(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.getPlanById)
);
router.patch(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.updatePlan)
);
router.delete(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.deletePlan)
);

router.post(
  "/:planId/exercises",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.addExercise)
);
router.delete(
  "/exercises/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.removeExercise)
);

router.patch(
  "/:planId/assign",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER]),
  asyncHandler(WorkoutController.assignToMember)
);

router.get(
  "/:planId/completions",
  roleMiddleware([ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER]),
  asyncHandler(WorkoutController.getCompletions)
);

export default router;
