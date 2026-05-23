import { Request, Response } from "express";
import { DietBuilderService } from "./diet-builder.service";

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

export class DietBuilderController {
  static async createPlan(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await DietBuilderService.createPlan(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Diet plan created successfully",
      data,
    });
  }

  static async addMeal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await DietBuilderService.addMeal(
      user,
      req.params.dietPlanId as string,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Meal added successfully",
      data,
    });
  }

  static async getPlans(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await DietBuilderService.getPlans(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getPlanById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await DietBuilderService.getPlanById(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async updateMeal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await DietBuilderService.updateMeal(
      user,
      req.params.mealId as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Meal updated successfully",
      data,
    });
  }

  static async deleteMeal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await DietBuilderService.deleteMeal(user, req.params.mealId as string);

    return res.json({
      success: true,
      message: "Meal deleted successfully",
    });
  }
}