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

  static async list(gymId?: string | null) {
  return prisma.auditLog.findMany({
    where: gymId ? { gymId } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}
}