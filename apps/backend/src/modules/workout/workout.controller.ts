import { Request, Response } from "express";
import * as workoutService from "./workout.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const createWorkoutPlan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;

  const plan = await workoutService.createWorkoutPlan(gymId, req.body);

  return successResponse(res, "Workout plan created successfully", plan, 201);
});

export const getWorkoutPlans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;

  const plans = await workoutService.getWorkoutPlans(gymId);

  return successResponse(res, "Workout plans fetched successfully", plans, 200);
});

export const getWorkoutPlanByMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const memberId = req.params.memberId as string;

  const plan = await workoutService.getWorkoutPlanByMember(gymId, memberId);

  return successResponse(res, "Workout plan fetched successfully", plan, 200);
});

export const updateWorkoutPlan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const memberId = req.params.memberId as string;

  const updated = await workoutService.updateWorkoutPlan(
    gymId,
    memberId,
    req.body
  );

  return successResponse(res, "Workout plan updated successfully", updated, 200);
});