import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { MembershipPlanService } from "./membership-plan.service";
import { createAuditLog } from "../../utils/audit";
import { createPlanSchema, updatePlanSchema } from "./membership-plan.validation";

function requireGym(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  if (!req.user.gymId) {
    res.status(400).json({ success: false, message: "Gym ID required" });
    return null;
  }
  return req.user.gymId;
}

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] || null };
}

export class MembershipPlanController {
  static async create(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = createPlanSchema.parse(req.body);
    const plan = await MembershipPlanService.create(gymId, data);

    await createAuditLog({
      gymId,
      userId: req.user?.id,
      action: AuditAction.CREATE,
      entity: "MembershipPlan",
      entityId: plan.id,
      newData: plan,
      ...meta(req),
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      data: plan,
    });
  }

  static async list(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const includeInactive = req.query.includeInactive !== "false";
    const plans = await MembershipPlanService.list(gymId, includeInactive);

    return res.json({ success: true, data: plans });
  }

  /** Member-facing active plan catalogue for the caller's own gym (+ GST %). */
  static async listPublic(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = await MembershipPlanService.listPublic(gymId);
    return res.json({ success: true, data });
  }

  static async update(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = updatePlanSchema.parse(req.body);
    const plan = await MembershipPlanService.update(
      gymId,
      req.params.id as string,
      data
    );

    await createAuditLog({
      gymId,
      userId: req.user?.id,
      action: AuditAction.UPDATE,
      entity: "MembershipPlan",
      entityId: plan.id,
      newData: plan,
      ...meta(req),
    });

    return res.json({
      success: true,
      message: "Membership plan updated successfully",
      data: plan,
    });
  }

  static async remove(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const id = req.params.id as string;
    const result = await MembershipPlanService.remove(gymId, id);

    await createAuditLog({
      gymId,
      userId: req.user?.id,
      action: AuditAction.DELETE,
      entity: "MembershipPlan",
      entityId: id,
      ...meta(req),
    });

    return res.json({
      success: true,
      message: "Membership plan removed successfully",
      data: result,
    });
  }
}
