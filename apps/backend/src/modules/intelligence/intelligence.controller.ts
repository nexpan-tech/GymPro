import { Request, Response } from "express";
import { IntelligenceService } from "./intelligence.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class IntelligenceController {
  static async dashboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getDashboard(user);
    return res.json({ success: true, data });
  }

  static async revenue(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getRevenueAnalytics(user);
    return res.json({ success: true, data });
  }

  static async attendance(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getAttendanceAnalytics(user);
    return res.json({ success: true, data });
  }

  static async retention(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getRetentionAnalytics(user);
    return res.json({ success: true, data });
  }

  static async churn(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getChurnAnalytics(user);
    return res.json({ success: true, data });
  }

  static async growth(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await IntelligenceService.getGrowthAnalytics(user);
    return res.json({ success: true, data });
  }

  static async insights(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await IntelligenceService.getGymInsights(user);

  return res.json({
    success: true,
    data,
  });
}

static async forecast(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await IntelligenceService.getRevenueForecast(user);

  return res.json({
    success: true,
    data,
  });
}

static async trainerPerformance(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await IntelligenceService.getTrainerPerformance(user);

  return res.json({
    success: true,
    data,
  });
}
static async engagement(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await IntelligenceService.getEngagementScoring(user);

  return res.json({
    success: true,
    data,
  });
}
}