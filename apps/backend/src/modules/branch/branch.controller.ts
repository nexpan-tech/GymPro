import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { BranchService } from "./branch.service";
import { createAuditLog } from "../../utils/audit";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class BranchController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.create(user, req.body);

    await createAuditLog({
      gymId: user.gymId,
      userId: user.id,
      action: AuditAction.CREATE,
      entity: "Branch",
      entityId: (data as { id?: string }).id ?? null,
      newData: data,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.getAll(user);

    return res.json({ success: true, data });
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.getById(user, req.params.id as string);

    return res.json({ success: true, data });
  }

  static async update(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.update(
      user,
      req.params.id as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Branch updated successfully",
      data,
    });
  }

  static async assignUser(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.assignUser(
      user,
      req.params.id as string,
      req.body.userId
    );

    return res.json({
      success: true,
      message: "User assigned to branch successfully",
      data,
    });
  }

  static async assignMember(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BranchService.assignMember(
      user,
      req.params.id as string,
      req.body.memberId
    );

    return res.json({
      success: true,
      message: "Member assigned to branch successfully",
      data,
    });
  }

  static async analyticsOverview(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.analyticsOverview(user);

  return res.json({ success: true, data });
}

static async comparisonAnalytics(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.comparisonAnalytics(user);

  return res.json({ success: true, data });
}

static async branchAnalytics(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.branchAnalytics(
    user,
    req.params.id as string
  );

  return res.json({ success: true, data });
}

static async assignRegionalManager(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.assignRegionalManager(
    user,
    req.params.id as string,
    req.body.managerId
  );

  return res.json({
    success: true,
    message: "Regional manager assigned to branch successfully",
    data,
  });
}

static async myBranches(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.myBranches(user);

  return res.json({
    success: true,
    data,
  });
}

static async centralReport(req: Request, res: Response) {
  const user = requireAuth(req, res);
  if (!user) return;

  const data = await BranchService.centralReport(user);

  return res.json({
    success: true,
    data,
  });
}
}