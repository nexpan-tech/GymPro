import { Request, Response } from "express";
import { GoalService } from "./goal.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return null;
  }

  return req.user;
}

export class GoalController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.create(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Goal created successfully",
      data,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.getAll(
      user,
      req.query.status as any
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getByMember(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.getByMember(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyGoals(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.getMyGoals(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async updateProgress(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.updateProgress(
      user,
      req.params.id as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Goal progress updated successfully",
      data,
    });
  }

  static async updateStatus(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.updateStatus(
      user,
      req.params.id as string,
      req.body.status
    );

    return res.json({
      success: true,
      message: "Goal status updated successfully",
      data,
    });
  }

  static async getSummary(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GoalService.getGoalSummary(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async delete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await GoalService.delete(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Goal deleted successfully",
    });
  }
}