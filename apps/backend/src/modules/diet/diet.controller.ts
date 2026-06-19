import { Request, Response } from "express";
import { DietService } from "./diet.service";
import {
  createDietPlanSchema,
  updateDietPlanSchema,
  createDietCompletionSchema,
} from "./diet.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class DietController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = createDietPlanSchema.parse(req.body);
    const diet = await DietService.create(user, data);

    return res.status(201).json({
      success: true,
      message: "Diet plan created successfully",
      data: diet,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const diets = await DietService.getAll(user);

    return res.json({
      success: true,
      data: diets,
    });
  }

  static async getMy(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const diet = await DietService.getMyPlan(user);

    return res.json({
      success: true,
      data: diet,
    });
  }

  static async getMyToday(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const day = typeof req.query.day === "string" ? req.query.day : undefined;
    const today = await DietService.getMyToday(user, day);

    return res.json({
      success: true,
      data: today,
    });
  }

  static async getMyWeek(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const week = await DietService.getMyWeek(user);

    return res.json({
      success: true,
      data: week,
    });
  }

  static async getByMember(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const diet = await DietService.getByMember(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data: diet,
    });
  }

  static async update(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = updateDietPlanSchema.parse(req.body);

    const updated = await DietService.update(
      user,
      req.params.memberId as string,
      data
    );

    return res.json({
      success: true,
      message: "Diet plan updated successfully",
      data: updated,
    });
  }

  static async delete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await DietService.delete(user, req.params.memberId as string);

    return res.json({
      success: true,
      message: "Diet plan deleted successfully",
    });
  }

  static async complete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = createDietCompletionSchema.parse(req.body);
    const completion = await DietService.completeMeal(user, data);

    return res.status(201).json({
      success: true,
      message: "Diet completion recorded",
      data: completion,
    });
  }

  static async getCompletions(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const memberId = req.query.memberId as string | undefined;
    const data = await DietService.getCompletions(user, memberId);

    return res.json({ success: true, data });
  }

  static async getAnalytics(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const memberId = req.query.memberId as string | undefined;
    const data = await DietService.getAnalytics(user, memberId);

    return res.json({ success: true, data });
  }
}