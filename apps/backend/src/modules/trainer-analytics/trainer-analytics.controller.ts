import { Request, Response } from "express";
import { TrainerAnalyticsService } from "./trainer-analytics.service";

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

export class TrainerAnalyticsController {
  static async getOverview(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TrainerAnalyticsService.getOverview(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getLeaderboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TrainerAnalyticsService.getLeaderboard(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyStats(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TrainerAnalyticsService.getMyStats(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getTrainerDetail(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TrainerAnalyticsService.getTrainerDetail(
      user,
      req.params.trainerId as string
    );

    return res.json({
      success: true,
      data,
    });
  }
}