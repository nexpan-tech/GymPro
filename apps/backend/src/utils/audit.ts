import { AuditAction } from "@prisma/client";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

interface AuditInput {
  gymId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        gymId: input.gymId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        oldData: input.oldData as object,
        newData: input.newData as object,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error("Audit log failed", error);
  }
}