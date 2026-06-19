import { Request, Response } from "express";
import { ProgressService } from "./progress.service";
import {
  createProgressEntrySchema,
  createProgressGoalSchema,
  updateProgressGoalSchema,
} from "./progress.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user;
}

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

// Resolve the target memberId: explicit param for /member/:memberId routes, or
// the caller's own member record for /my routes.
async function resolveMemberId(req: Request): Promise<string> {
  const param = req.params.memberId;
  if (param) return Array.isArray(param) ? param[0] : param;
  return ProgressService.myMemberId(req.user!);
}

export class ProgressController {
  // Entries
  static async createEntry(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    const data = createProgressEntrySchema.parse(req.body);
    return ok(res, await ProgressService.createEntry(user, memberId, data), 201);
  }

  static async getTimeline(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    return ok(res, await ProgressService.getTimeline(user, memberId));
  }

  static async getCharts(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    return ok(res, await ProgressService.getCharts(user, memberId));
  }

  static async getSummary(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    return ok(res, await ProgressService.getSummary(user, memberId));
  }

  static async getMonthlyReport(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;
    return ok(res, await ProgressService.getMonthlyReport(user, memberId, month));
  }

  static async deleteEntry(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    return ok(res, await ProgressService.deleteEntry(user, req.params.id as string));
  }

  // Goals
  static async listGoals(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    return ok(res, await ProgressService.listGoals(user, memberId));
  }

  static async createGoal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    const data = createProgressGoalSchema.parse(req.body);
    return ok(res, await ProgressService.createGoal(user, memberId, data), 201);
  }

  static async updateGoal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    const data = updateProgressGoalSchema.parse(req.body);
    return ok(
      res,
      await ProgressService.updateGoal(user, memberId, req.params.goalId as string, data),
    );
  }

  static async deleteGoal(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const memberId = await resolveMemberId(req);
    await ProgressService.deleteGoal(user, memberId, req.params.goalId as string);
    return ok(res, { deleted: true });
  }
}
