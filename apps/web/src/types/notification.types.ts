// ─── Notification Type Enum ───────────────────────────────────────────────────

export type NotificationType =
  | "MEMBERSHIP_RENEWAL"
  | "PAYMENT_REMINDER"
  | "ATTENDANCE_REMINDER"
  | "GENERAL"
  | "DIET_PLAN_UPDATED"
  | "WORKOUT_PLAN_UPDATED"
  | "GOAL_ACHIEVED"
  | "BADGE_EARNED"
  | "SESSION_REMINDER"
  | "SESSION_CANCELLED"
  | "CHALLENGE_STARTED"
  | "CHALLENGE_COMPLETED"
  | "LEAD_ASSIGNED"
  | "SYSTEM_ALERT";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED" | "DISMISSED";

// ─── Notification Interface ───────────────────────────────────────────────────

export interface Notification {
  id: string;
  gymId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  channel?: NotificationChannel | null;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "CANCELLED";

export interface Campaign {
  id: string;
  gymId: string;
  name: string;
  subject?: string | null;
  body: string;
  type: NotificationType;
  channels: NotificationChannel[];
  status: CampaignStatus;
  targetAudience?: string | null;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
