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

/**
 * Persist a semantic audit log entry.
 *
 * The AuditLog model stores the entity name in `entityType` and keeps the
 * before/after snapshots inside the `metadata` JSON column. Callers still pass
 * the friendlier `entity` / `oldData` / `newData` shape; we map it here so the
 * write actually matches the Prisma schema (previously these field names did
 * not exist on the model, so every audit write silently failed at runtime).
 */
export async function createAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        gymId: input.gymId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entity,
        entityId: input.entityId ?? null,
        metadata: {
          ...(input.oldData !== undefined
            ? { oldData: input.oldData as object }
            : {}),
          ...(input.newData !== undefined
            ? { newData: input.newData as object }
            : {}),
        },
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error("Audit log failed", error);
  }
}
