import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "PAYMENT"
  | "CHECK_IN";

export interface AuditLog {
  id: string;
  gymId: string | null;
  userId?: string | null;
  action: AuditActionType;
  entityType?: string | null;
  entityId?: string | null;
  method?: string | null;
  path?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  // Enriched fields from the platform audit feed.
  event?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  gymName?: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────
// Backend scopes results automatically: SUPER_ADMIN (null gymId) sees all logs;
// a gym admin sees only their own gym's logs. Filtering is done client-side.

export const auditService = {
  /** GET /audit — most recent audit log entries the caller may view. */
  list: async (): Promise<AuditLog[]> => {
    const res = await api.get<ApiResponse<AuditLog[]>>("/audit");
    return res.data.data;
  },
};
