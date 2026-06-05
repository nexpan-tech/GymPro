import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { MembershipService } from "./membership.service";
import { createAuditLog } from "../../utils/audit";
import {
  createMembershipSchema,
  updateMembershipSchema,
  renewMembershipSchema,
  freezeMembershipSchema,
  extendMembershipSchema,
} from "./membership.validation";

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export class MembershipController {
  static async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const data = createMembershipSchema.parse(req.body);

    const membership = await MembershipService.create(gymId, data);

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.CREATE,
      entity: "Membership",
      entityId: membership.id,
      newData: membership,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership created successfully",
      data: membership,
    });
  }

  static async getAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const currentOnly = req.query.currentOnly === "true";
    const memberships = await MembershipService.getAll(req.user.gymId, {
      currentOnly,
    });

    return res.json({
      success: true,
      data: memberships,
    });
  }

  static async getByMember(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberId = req.params.memberId as string;

    const memberships = await MembershipService.getByMember(
      req.user.gymId,
      memberId
    );

    return res.json({
      success: true,
      data: memberships,
    });
  }

  static async update(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const membershipId = req.params.id as string;

    const oldMembership = await MembershipService.getById(gymId, membershipId);

    const data = updateMembershipSchema.parse(req.body);

    const updated = await MembershipService.update(
      gymId,
      membershipId,
      data
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "Membership",
      entityId: updated.id,
      oldData: oldMembership,
      newData: updated,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership updated successfully",
      data: updated,
    });
  }

  static async getMy(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await MembershipService.getMyMemberships({
      id: req.user.id,
      gymId: req.user.gymId,
    });

    return res.json({ success: true, data });
  }

  static async analytics(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = await MembershipService.analytics(req.user.gymId);
    return res.json({ success: true, data });
  }

  static async renew(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const data = renewMembershipSchema.parse(req.body);
    const membership = await MembershipService.renew(
      gymId,
      req.params.id as string,
      data
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.CREATE,
      entity: "MembershipRenewal",
      entityId: membership.id,
      newData: membership,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership renewed successfully",
      data: membership,
    });
  }

  static async freeze(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const data = freezeMembershipSchema.parse(req.body);
    const membership = await MembershipService.freeze(
      gymId,
      req.params.id as string,
      data
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "MembershipFreeze",
      entityId: membership.id,
      newData: membership,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership frozen successfully",
      data: membership,
    });
  }

  static async extend(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const data = extendMembershipSchema.parse(req.body);
    const membership = await MembershipService.extend(
      gymId,
      req.params.id as string,
      data
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "MembershipExtension",
      entityId: membership.id,
      newData: membership,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership extended successfully",
      data: membership,
    });
  }

  static async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;
    const membershipId = req.params.id as string;

    const oldMembership = await MembershipService.getById(gymId, membershipId);

    await MembershipService.delete(gymId, membershipId);

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.DELETE,
      entity: "Membership",
      entityId: membershipId,
      oldData: oldMembership,
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Membership deleted successfully",
    });
  }
}