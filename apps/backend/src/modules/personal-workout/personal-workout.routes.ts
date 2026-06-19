import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { PersonalWorkoutController } from "./personal-workout.controller";

const router = Router();
router.use(authMiddleware, roleMiddleware([ROLES.MEMBER]));

router.get("/", asyncHandler(PersonalWorkoutController.list));
router.post("/", asyncHandler(PersonalWorkoutController.create));
router.get("/stats", asyncHandler(PersonalWorkoutController.stats));
router.get("/history", asyncHandler(PersonalWorkoutController.history));
router.get("/week", asyncHandler(PersonalWorkoutController.week));

router.get("/:id", asyncHandler(PersonalWorkoutController.get));
router.patch("/:id", asyncHandler(PersonalWorkoutController.update));
router.delete("/:id", asyncHandler(PersonalWorkoutController.remove));
router.post("/:id/duplicate", asyncHandler(PersonalWorkoutController.duplicate));
router.patch("/:id/archive", asyncHandler(PersonalWorkoutController.archive));
router.patch("/:id/favorite", asyncHandler(PersonalWorkoutController.favorite));
router.post("/:id/complete", asyncHandler(PersonalWorkoutController.complete));

export default router;
