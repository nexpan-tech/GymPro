import { Request, Response } from "express";
import { LeadService } from "./lead.service";

function requireAuth(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return user;
}

export class LeadController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const lead = await LeadService.create(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const leads = await LeadService.getAll(user);

    return res.json({
      success: true,
      data: leads,
    });
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const lead = await LeadService.getById(user, req.params.id as string);

    return res.json({
      success: true,
      data: lead,
    });
  }

  static async update(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const lead = await LeadService.update(
      user,
      req.params.id as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  }

  static async remove(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await LeadService.remove(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Lead deleted successfully",
      data: result,
    });
  }

  static async funnelAnalytics(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await LeadService.getFunnelAnalytics(user);

  return res.json({
    success: true,
    data,
  });
}

static async processFollowUps(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await LeadService.processFollowUps(user);

  return res.json({
    success: true,
    message: "Lead follow-ups processed successfully",
    data,
  });
}
}