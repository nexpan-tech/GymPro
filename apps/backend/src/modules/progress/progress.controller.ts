import { Request, Response } from "express";
import { ProgressService } from "./progress.service";

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

export class ProgressController {
  static async createMeasurement(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ProgressService.createMeasurement(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Progress measurement created successfully",
      data,
    });
  }

  static async getMemberMeasurements(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ProgressService.getMemberMeasurements(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyMeasurements(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ProgressService.getMyMeasurements(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getProgressSummary(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ProgressService.getProgressSummary(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async deleteMeasurement(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await ProgressService.deleteMeasurement(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Progress measurement deleted successfully",
    });
  }

  static async getAnalytics(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await ProgressService.getAnalytics(
    user,
    req.params.memberId as string
  );

  return res.json({
    success: true,
    data,
  });
}
}