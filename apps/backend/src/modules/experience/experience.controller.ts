import { Request, Response } from "express";
import { ExperienceService } from "./experience.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class ExperienceController {
  static async dashboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExperienceService.personalizedDashboard(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async recommendations(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExperienceService.recommendations(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }
}