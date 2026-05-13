import { Request, Response } from "express";
import { GymService } from "./gym.service";
import {
  createGymSchema,
  updateGymSchema,
} from "./gym.validation";

export class GymController {
  static async create(req: Request, res: Response) {
    const data = createGymSchema.parse(req.body);

    const gym = await GymService.create(data);

    res.json({
      success: true,
      message: "Gym created successfully",
      data: gym,
    });
  }

  static async getAll(req: Request, res: Response) {
    const gyms = await GymService.getAll();

    res.json({
      success: true,
      data: gyms,
    });
  }

  static async getById(req: Request, res: Response) {
    const gym = await GymService.getById(req.params.id as string);

    res.json({
      success: true,
      data: gym,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateGymSchema.parse(req.body);

    const gym = await GymService.update(req.params.id as string, data);

    res.json({
      success: true,
      message: "Gym updated successfully",
      data: gym,
    });
  }

  static async activate(req: Request, res: Response) {
    const gym = await GymService.activate(req.params.id as string);

    res.json({
      success: true,
      message: "Gym activated",
      data: gym,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const gym = await GymService.deactivate(req.params.id as string);

    res.json({
      success: true,
      message: "Gym deactivated",
      data: gym,
    });
  }

  static async delete(req: Request, res: Response) {
    await GymService.delete(req.params.id as string);

    res.json({
      success: true,
      message: "Gym deleted successfully",
    });
  }
}