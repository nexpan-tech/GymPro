import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { GoalController } from "./goal.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", GoalController.create);
router.get("/", GoalController.getAll);
router.get("/me", GoalController.getMyGoals);
router.get("/member/:memberId", GoalController.getByMember);
router.get("/summary/member/:memberId", GoalController.getSummary);
router.patch("/:id/progress", GoalController.updateProgress);
router.patch("/:id/status", GoalController.updateStatus);
router.delete("/:id", GoalController.delete);

export default router;