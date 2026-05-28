import { Request, Response } from "express";
import { CommunityService } from "./community.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class CommunityController {
  static async createChallenge(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.createChallenge(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      data,
    });
  }

  static async getChallenges(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.getChallenges(user);

    return res.json({ success: true, data });
  }

  static async joinChallenge(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.joinChallenge(
      user,
      req.params.id as string,
      req.body.memberId
    );

    return res.json({
      success: true,
      message: "Joined challenge successfully",
      data,
    });
  }

  static async updateProgress(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.updateProgress(
      user,
      req.params.id as string,
      req.body.memberId,
      Number(req.body.progress)
    );

    return res.json({
      success: true,
      message: "Challenge progress updated successfully",
      data,
    });
  }

  static async leaderboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.leaderboard(
      user,
      req.params.id as string
    );

    return res.json({ success: true, data });
  }

  static async globalLeaderboard(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunityService.globalLeaderboard(user);

    return res.json({ success: true, data });
  }

  static async createGroup(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await CommunityService.createGroup(user, req.body);

  return res.status(201).json({
    success: true,
    message: "Community group created successfully",
    data,
  });
}

static async getGroups(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await CommunityService.getGroups(user);

  return res.json({
    success: true,
    data,
  });
}

static async joinGroup(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await CommunityService.joinGroup(
    user,
    req.params.id as string,
    req.body.memberId
  );

  return res.json({
    success: true,
    message: "Joined community group successfully",
    data,
  });
}
}