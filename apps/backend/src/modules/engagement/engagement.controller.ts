import { Request, Response } from "express";
import { EngagementService } from "./engagement.service";

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

export class EngagementController {
  static async getAttendanceEngagement(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await EngagementService.getAttendanceEngagement(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyAttendanceEngagement(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await EngagementService.getMyAttendanceEngagement(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getLowEngagementMembers(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await EngagementService.getLowEngagementMembers(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getChurnRiskMembers(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await EngagementService.getChurnRiskMembers(user);

  return res.json({
    success: true,
    data,
  });
}

static async getAttendanceDropMembers(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await EngagementService.getAttendanceDropMembers(user);

  return res.json({
    success: true,
    data,
  });
}

static async sendEncouragement(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await EngagementService.sendEncouragement(
    user,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: "Encouragement sent successfully",
    data,
  });
}
 
  static async getWorkoutStreaks(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await EngagementService.getWorkoutStreaks(user);

  return res.json({
    success: true,
    data,
  });
}
}