import { Request, Response } from "express";
import { GamificationService } from "./gamification.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class GamificationController {
  static async addXp(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.addXp(
      user,
      req.body.memberId,
      Number(req.body.xp)
    );

    return res.json({
      success: true,
      message: "XP added successfully",
      data,
    });
  }

  static async getMemberXp(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.getMemberXp(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async createMission(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.createMission(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Daily mission created successfully",
      data,
    });
  }

  static async getMissions(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.getMissions(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async completeMission(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.completeMission(
      user,
      req.params.id as string,
      req.body.memberId
    );

    return res.json({
      success: true,
      message: "Mission completed successfully",
      data,
    });
  }

  static async createReward(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await GamificationService.createReward(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Reward created successfully",
      data,
    });
  }

  static async getRewards(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    // Staff can request ?all=true to also see inactive rewards.
    const all = req.query.all === "true" && (user.role === "ADMIN" || user.role === "RECEPTIONIST");
    const data = await GamificationService.getRewards(user, { all });

    return res.json({
      success: true,
      data,
    });
  }

  static async updateReward(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.updateReward(user, req.params.id as string, req.body);
    return res.json({ success: true, message: "Reward updated", data });
  }

  static async deleteReward(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.deleteReward(user, req.params.id as string);
    return res.json({ success: true, message: "Reward removed", data });
  }

  static async updateStreak(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await GamificationService.updateStreak(
    user,
    req.body.memberId
  );

  return res.json({
    success: true,
    message: "Habit streak updated successfully",
    data,
  });
}

  // ── Stage 8 endpoints ──────────────────────────────────────────────────────
  static async mySummary(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.getSummary(user, req.query.memberId as string | undefined);
    return res.json({ success: true, data });
  }

  static async myPointHistory(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.getPointHistory(user, req.query.memberId as string | undefined);
    return res.json({ success: true, data });
  }

  static async redeemReward(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.redeemReward(user, req.params.id as string, req.body.memberId);
    return res.status(201).json({ success: true, message: "Reward redeemed", data });
  }

  static async listRedemptions(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.listRedemptions(user);
    return res.json({ success: true, data });
  }

  static async myRedemptions(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.myRedemptions(user);
    return res.json({ success: true, data });
  }

  static async updateRedemptionStatus(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.updateRedemptionStatus(user, req.params.id as string, req.body.status);
    return res.json({ success: true, message: "Redemption updated", data });
  }

  static async leaderboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const period = req.query.period === "MONTH" ? "MONTH" : "ALL";
    const data = await GamificationService.leaderboard(
      user,
      (req.query.scope as string) || "GYM",
      req.query.refId as string | undefined,
      20,
      period,
    );
    return res.json({ success: true, data });
  }

  static async analytics(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.analytics(user);
    return res.json({ success: true, data });
  }

  static async trainerMembers(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await GamificationService.getTrainerMembers(user);
    return res.json({ success: true, data });
  }

  static async platformEngagement(_req: Request, res: Response) {
    const data = await GamificationService.getPlatformEngagement();
    return res.json({ success: true, data });
  }
}