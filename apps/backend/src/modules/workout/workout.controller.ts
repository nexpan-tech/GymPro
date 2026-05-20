import { Request, Response } from "express";
import * as workoutService from "./workout.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export const createWorkoutPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const plan = await workoutService.createWorkoutPlan(user, req.body);

    return successResponse(
      res,
      "Workout plan created successfully",
      plan,
      201
    );
  }
);

export const getWorkoutPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const plans = await workoutService.getWorkoutPlans(user);

    return successResponse(
      res,
      "Workout plans fetched successfully",
      plans,
      200
    );
  }
);

export const getWorkoutPlanByMember = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const plan = await workoutService.getWorkoutPlanByMember(
      user,
      req.params.memberId as string
    );

    return successResponse(
      res,
      "Workout plan fetched successfully",
      plan,
      200
    );
  }
);

export const updateWorkoutPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const updated = await workoutService.updateWorkoutPlan(
      user,
      req.params.memberId as string,
      req.body
    );

    return successResponse(
      res,
      "Workout plan updated successfully",
      updated,
      200
    );
  }
);