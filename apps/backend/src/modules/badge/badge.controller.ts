import { Request, Response } from "express";
import { BadgeService } from "./badge.service";

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

export class BadgeController {
  static async createBadge(req: Request, res: Response) {
    const data = await BadgeService.createBadge(req.body);

    return res.status(201).json({
      success: true,
      message: "Badge created successfully",
      data,
    });
  }

  static async getBadges(_req: Request, res: Response) {
    const data = await BadgeService.getBadges();

    return res.json({
      success: true,
      data,
    });
  }

  static async awardBadge(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BadgeService.awardBadge(
      user,
      req.body.memberId,
      req.body.badgeId
    );

    return res.status(201).json({
      success: true,
      message: "Badge awarded successfully",
      data,
    });
  }

  static async getMemberBadges(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BadgeService.getMemberBadges(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyBadges(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BadgeService.getMyBadges(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async autoAwardGoalBadge(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BadgeService.autoAwardGoalBadge(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      message: "Goal badge checked successfully",
      data,
    });
  }

  static async autoAwardAttendanceBadge(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BadgeService.autoAwardAttendanceBadge(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      message: "Attendance badge checked successfully",
      data,
    });
  }
}