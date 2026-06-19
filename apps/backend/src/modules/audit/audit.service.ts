import { prisma } from "../../config/db";
import { CreateAuditLogDto } from "./dto/create-audit-log.dto";

export class AuditService {
  static async create(data: CreateAuditLogDto) {
    try {
      return await prisma.auditLog.create({
        data: {
          gymId: data.gymId || null,
          userId: data.userId || null,
          action: data.action as any,
          method: data.method,
          path: data.path,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: {
            entityType: data.entityType || null,
            entityId: data.entityId || null,
            ...(data.metadata || {}),
          },
        } as any,
      });
    } catch (error) {
      console.error("Audit log creation failed", error);
    }
  }

  /**
   * Filterable audit feed. `gymId` scopes a gym admin to their tenant (null for
   * SUPER_ADMIN = whole platform). Supports action / event / actor / date-range
   * filters + free-text search, and enriches rows with actor + gym names.
   */
  static async list(opts: {
    gymId?: string | null;
    action?: string;
    event?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
    limit?: number;
  } = {}) {
    const where: any = {};
    if (opts.gymId) where.gymId = opts.gymId;
    if (opts.action) where.action = opts.action;
    if (opts.userId) where.userId = opts.userId;
    if (opts.from || opts.to) {
      where.createdAt = {
        ...(opts.from ? { gte: new Date(opts.from) } : {}),
        ...(opts.to ? { lte: new Date(opts.to) } : {}),
      };
    }

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(opts.limit ?? 300, 1000),
      include: {
        user: { select: { name: true, email: true, role: true } },
        gym: { select: { name: true } },
      },
    });

    let result = rows;
    if (opts.event) result = result.filter((r) => (r.metadata as any)?.event === opts.event);
    if (opts.search) {
      const q = opts.search.toLowerCase();
      result = result.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }

    return result.map((r) => ({
      id: r.id,
      action: r.action,
      event: (r.metadata as any)?.event ?? null,
      entityType: (r.metadata as any)?.entityType ?? r.entityType ?? null,
      entityId: r.entityId,
      actorName: r.user?.name ?? null,
      actorEmail: r.user?.email ?? null,
      actorRole: r.user?.role ?? null,
      gymId: r.gymId,
      gymName: r.gym?.name ?? null,
      ipAddress: r.ipAddress,
      metadata: r.metadata,
      createdAt: r.createdAt,
    }));
  }
}