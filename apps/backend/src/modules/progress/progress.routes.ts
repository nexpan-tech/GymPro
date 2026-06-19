import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ProgressController } from "./progress.controller";

const router = Router();

router.use(authMiddleware);

// ── Member / self ────────────────────────────────────────────────────────────
router.get("/my", asyncHandler(ProgressController.getTimeline));
router.post("/my", asyncHandler(ProgressController.createEntry));
router.get("/my/timeline", asyncHandler(ProgressController.getTimeline));
router.get("/my/charts", asyncHandler(ProgressController.getCharts));
router.get("/my/summary", asyncHandler(ProgressController.getSummary));
router.get("/my/monthly-report", asyncHandler(ProgressController.getMonthlyReport));
router.get("/my/goals", asyncHandler(ProgressController.listGoals));
router.post("/my/goals", asyncHandler(ProgressController.createGoal));
router.patch("/my/goals/:goalId", asyncHandler(ProgressController.updateGoal));
router.delete("/my/goals/:goalId", asyncHandler(ProgressController.deleteGoal));

// ── Trainer / Admin (specific member) ────────────────────────────────────────
router.get("/member/:memberId", asyncHandler(ProgressController.getTimeline));
router.post("/member/:memberId", asyncHandler(ProgressController.createEntry));
router.get("/member/:memberId/timeline", asyncHandler(ProgressController.getTimeline));
router.get("/member/:memberId/charts", asyncHandler(ProgressController.getCharts));
router.get("/member/:memberId/summary", asyncHandler(ProgressController.getSummary));
router.get("/member/:memberId/monthly-report", asyncHandler(ProgressController.getMonthlyReport));
router.get("/member/:memberId/goals", asyncHandler(ProgressController.listGoals));
router.post("/member/:memberId/goals", asyncHandler(ProgressController.createGoal));
router.patch("/member/:memberId/goals/:goalId", asyncHandler(ProgressController.updateGoal));
router.delete("/member/:memberId/goals/:goalId", asyncHandler(ProgressController.deleteGoal));

// ── Entry delete (access enforced via the entry's member) ────────────────────
router.delete("/entries/:id", asyncHandler(ProgressController.deleteEntry));

export default router;
