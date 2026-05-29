export interface CreateAuditLogDto {
  gymId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  method: string;
  path: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}