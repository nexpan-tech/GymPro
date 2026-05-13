import { Request, Response } from "express";
import { DietService } from "./diet.service";
import {
  createDietPlanSchema,
  updateDietPlanSchema,
} from "./diet.validation";

export class DietController {
  static async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = createDietPlanSchema.parse(req.body);

    const diet = await DietService.create(req.user.gymId, data);

    res.json({
      success: true,
      message: "Diet plan created successfully",
      data: diet,
    });
  }

  static async getAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const diets = await DietService.getAll(req.user.gymId);

    res.json({
      success: true,
      data: diets,
    });
  }

  static async getByMember(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberId = req.params.memberId as string;

    const diet = await DietService.getByMember(
      req.user.gymId,
      memberId
    );

    res.json({
      success: true,
      data: diet,
    });
  }

  static async update(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberId = req.params.memberId as string;
    const data = updateDietPlanSchema.parse(req.body);

    const updated = await DietService.update(
      req.user.gymId,
      memberId,
      data
    );

    res.json({
      success: true,
      message: "Diet plan updated successfully",
      data: updated,
    });
  }

  static async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberId = req.params.memberId as string;

    await DietService.delete(req.user.gymId, memberId);

    res.json({
      success: true,
      message: "Diet plan deleted successfully",
    });
  }
}