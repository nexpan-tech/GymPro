import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { WorkoutController } from "./workout.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", WorkoutController.createPlan);
router.get("/", WorkoutController.getPlans);
router.get("/:id", WorkoutController.getPlanById);

router.post("/:planId/exercises", WorkoutController.addExercise);
router.delete("/exercises/:id", WorkoutController.removeExercise);

router.patch("/:planId/assign", WorkoutController.assignToMember);
router.delete("/:id", WorkoutController.deletePlan);

router.post("/complete", WorkoutController.completeWorkout);
router.get("/:planId/completions", WorkoutController.getCompletions);

export default router;