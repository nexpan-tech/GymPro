import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { GymService } from "./gym.service";
import { createAuditLog } from "../../utils/audit";
import { createGymSchema, updateGymSchema } from "./gym.validation";

export class GymController {
  static async create(req: Request, res: Response) {
    const data = createGymSchema.parse(req.body);
    const result = await GymService.create(data);

    await createAuditLog({
      gymId: result.gym.id,
      userId: req.user?.id ?? null,
      action: AuditAction.CREATE,
      entity: "Gym",
      entityId: result.gym.id,
      newData: { gym: result.gym, adminCreated: Boolean(result.admin) },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
    });

    return res.status(201).json({
      success: true,
      message: "Gym created successfully",
      data: result,
    });
  }

  static async getAll(req: Request, res: Response) {
    const gyms = await GymService.getAll();

    return res.json({
      success: true,
      data: gyms,
    });
  }

  static async getById(req: Request, res: Response) {
    const gym = await GymService.getById(req.params.id as string);

    return res.json({
      success: true,
      data: gym,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateGymSchema.parse(req.body);
    const before = await GymService.getById(req.params.id as string);
    const gym = await GymService.update(req.params.id as string, data);

    const priceChanged =
      data.pricePerActiveMember !== undefined &&
      data.pricePerActiveMember !== (before as { pricePerActiveMember?: number }).pricePerActiveMember;
    await createAuditLog({
      gymId: gym.id, userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "Gym", entityId: gym.id,
      newData: {
        event: priceChanged ? "GYM_PRICE_CHANGED" : "GYM_UPDATED",
        ...(priceChanged ? { from: (before as { pricePerActiveMember?: number }).pricePerActiveMember, to: data.pricePerActiveMember } : {}),
        fields: Object.keys(data),
      },
      ipAddress: req.ip, userAgent: req.headers["user-agent"] || null,
    });

    return res.json({
      success: true,
      message: "Gym updated successfully",
      data: gym,
    });
  }

  static async activate(req: Request, res: Response) {
    const gym = await GymService.activate(req.params.id as string);
    await createAuditLog({
      gymId: gym.id, userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "Gym", entityId: gym.id,
      newData: { event: "GYM_ACTIVATED" }, ipAddress: req.ip, userAgent: req.headers["user-agent"] || null,
    });

    return res.json({
      success: true,
      message: "Gym activated successfully",
      data: gym,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const gym = await GymService.deactivate(req.params.id as string);
    await createAuditLog({
      gymId: gym.id, userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "Gym", entityId: gym.id,
      newData: { event: "GYM_SUSPENDED" }, ipAddress: req.ip, userAgent: req.headers["user-agent"] || null,
    });

    return res.json({
      success: true,
      message: "Gym deactivated successfully",
      data: gym,
    });
  }

  static async delete(req: Request, res: Response) {
    await GymService.delete(req.params.id as string);

    return res.json({
      success: true,
      message: "Gym deleted successfully",
    });
  }
}