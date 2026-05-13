import { Request, Response } from "express";
import { analyticsService } from "./analytics.service";

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    const gymId = req.user?.gymId;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym ID is required",
      });
    }

    const data = await analyticsService.getDashboard(gymId);

    return res.json({
      success: true,
      data,
    });
  }

  async getRevenueChart(req: Request, res: Response) {
    const gymId = req.user?.gymId;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym ID is required",
      });
    }

    const data = await analyticsService.getRevenueChart(gymId);

    return res.json({
      success: true,
      data,
    });
  }

  async getMembershipDistribution(req: Request, res: Response) {
    const gymId = req.user?.gymId;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym ID is required",
      });
    }

    const data = await analyticsService.getMembershipDistribution(gymId);

    return res.json({
      success: true,
      data,
    });
  }

  async getGymOverview(req: Request, res: Response) {
    const gymId = req.user?.gymId;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym ID is required",
      });
    }

    const data = await analyticsService.getGymOverview(gymId);

    return res.json({
      success: true,
      data,
    });
  }
}

export const analyticsController = new AnalyticsController();