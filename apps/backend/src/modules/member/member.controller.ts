import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { MemberService } from "./member.service";
import { createAuditLog } from "../../utils/audit";
import {
  createMemberSchema,
  updateMemberSchema,
} from "./member.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

function requireGym(req: Request, res: Response) {
  const user = requireAuth(req, res);

  if (!user) return null;

  if (!user.gymId) {
    res.status(400).json({ success: false, message: "Gym ID required" });
    return null;
  }

  return user.gymId;
}

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export class MemberController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = createMemberSchema.parse(req.body);
    const member = await MemberService.create(gymId, data);

    await createAuditLog({
      gymId,
      userId: user.id,
      action: AuditAction.CREATE,
      entity: "Member",
      entityId: member.id,
      newData: member,
      ...getRequestMeta(req),
    });

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const branchId =
      typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const members = await MemberService.getAll(user, branchId);

    return res.json({
      success: true,
      data: members,
    });
  }

  static async me(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const member = await MemberService.getMyProfile(user);

    return res.json({
      success: true,
      data: member,
    });
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const member = await MemberService.getById(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      data: member,
    });
  }

  static async update(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const gymId = requireGym(req, res);
    if (!gymId) return;

    const memberId = req.params.id as string;
    const oldMember = await MemberService.getById(user, memberId);

    const data = updateMemberSchema.parse(req.body);

    const member = await MemberService.update(
      gymId,
      memberId,
      data
    );

    await createAuditLog({
      gymId,
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: "Member",
      entityId: member.id,
      oldData: oldMember,
      newData: member,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  }

  static async delete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const gymId = requireGym(req, res);
    if (!gymId) return;

    const memberId = req.params.id as string;
    const oldMember = await MemberService.getById(user, memberId);

    // ?hard=true performs a permanent delete when the member has no history.
    const hard = req.query.hard === "true";
    if (hard) {
      await MemberService.hardDelete(gymId, memberId);
    } else {
      await MemberService.delete(gymId, memberId);
    }

    await createAuditLog({
      gymId,
      userId: user.id,
      action: AuditAction.DELETE,
      entity: "Member",
      entityId: memberId,
      oldData: oldMember,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: hard ? "Member permanently deleted" : "Member deactivated",
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const memberId = req.params.id as string;
    const data = await MemberService.resetPassword(gymId, memberId, req.body?.password);

    await createAuditLog({
      gymId,
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: "Member",
      entityId: memberId,
      newData: { passwordReset: true },
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
      data, // includes temporaryPassword — shown once to the admin
    });
  }
}