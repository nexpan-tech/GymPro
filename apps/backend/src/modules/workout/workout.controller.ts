import { Request, Response } from "express";
import { WorkoutService } from "./workout.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class WorkoutController {
  static async createPlan(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.createPlan(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Workout plan created successfully",
      data,
    });
  }

  static async getPlans(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.getPlans(user);

    return res.json({ success: true, data });
  }

  static async getPlanById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.getPlanById(
      user,
      req.params.id as string
    );

    return res.json({ success: true, data });
  }

  static async addExercise(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.addExercise(
      user,
      req.params.planId as string,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Exercise added to workout plan",
      data,
    });
  }

  static async removeExercise(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await WorkoutService.removeExercise(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Exercise removed from workout plan",
    });
  }

  static async assignToMember(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.assignToMember(
      user,
      req.params.planId as string,
      req.body.memberId
    );

    return res.json({
      success: true,
      message: "Workout plan assigned successfully",
      data,
    });
  }

  static async deletePlan(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await WorkoutService.deletePlan(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Workout plan deleted successfully",
    });
  }

  static async completeWorkout(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await WorkoutService.completeWorkout(user, req.body);

  return res.status(201).json({
    success: true,
    message: "Workout completed successfully",
    data,
  });
}

static async getCompletions(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await WorkoutService.getCompletions(
    user,
    req.params.planId as string
  );

  return res.json({
    success: true,
    data,
  });
}

  static async updatePlan(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.updatePlan(
      user,
      req.params.id as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Workout plan updated successfully",
      data,
    });
  }

  static async getByMember(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.getByMember(
      user,
      req.params.memberId as string
    );

    return res.json({ success: true, data });
  }

  static async getMyPlans(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WorkoutService.getMyPlans(user);

    return res.json({ success: true, data });
  }

  static async getAnalytics(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const memberId = req.query.memberId as string | undefined;
    const data = await WorkoutService.getAnalytics(user, memberId);

    return res.json({ success: true, data });
  }
}