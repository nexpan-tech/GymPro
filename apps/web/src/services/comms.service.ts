import { api } from "@/lib/api";

export type CommChannel = "IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WHATSAPP" | "SOCKET";
export type AnnouncementAudience = "ALL" | "MEMBERS" | "TRAINERS" | "STAFF" | "BRANCH" | "CUSTOM";
export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "SENT" | "EXPIRED" | "CANCELLED";
export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  branchId?: string | null;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  channels: CommChannel[];
  scheduledAt?: string | null;
  expiresAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  createdBy?: { name: string };
  _count?: { receipts: number };
}

export interface CommsAnalytics {
  notifications: { total: number; read: number; readRate: number };
  delivery: { sent: number; failed: number; total: number };
  channels: Record<string, { sent: number; failed: number; skipped: number }>;
  announcements: { sent: number; recipients: number; reads: number; readRate: number };
  chat: { avgResponseMs: number; avgResponseMinutes: number; samples: number };
}

export interface DeliveryLogRow {
  id: string;
  channel: CommChannel;
  status: string;
  recipientAddr?: string | null;
  provider?: string | null;
  title?: string | null;
  error?: string | null;
  createdAt: string;
}

export interface ChatThread {
  memberId: string;
  name: string;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}
export interface ChatMessage {
  id: string;
  memberId: string;
  trainerId: string;
  senderId: string;
  type: string;
  message: string;
  isRead?: boolean;
  createdAt: string;
  sender?: { id: string; name: string; role: string };
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const commsService = {
  channels: async (): Promise<Record<CommChannel, boolean>> =>
    unwrap<Record<CommChannel, boolean>>(await api.get("/comms/channels")),
  broadcast: async (payload: { audience: AnnouncementAudience; branchId?: string; memberIds?: string[]; channels: CommChannel[]; title: string; message: string }): Promise<unknown> =>
    unwrap<unknown>(await api.post("/comms/broadcast", payload)),
  analytics: async (): Promise<CommsAnalytics> => unwrap<CommsAnalytics>(await api.get("/comms/analytics")),
  deliveryLogs: async (): Promise<DeliveryLogRow[]> => unwrap<DeliveryLogRow[]>(await api.get("/comms/delivery-logs")) ?? [],
  queueHealth: async (): Promise<{ name: string; waiting: number; active: number; completed: number; failed: number; delayed: number }[]> =>
    unwrap(await api.get("/comms/queues/health")) ?? [],
  dlq: async (): Promise<{ id: string; originalQueue: string; errorMessage: string; attemptsMade: number }[]> =>
    unwrap(await api.get("/comms/queues/dlq")) ?? [],
  retryDlq: async (id: string): Promise<unknown> => unwrap(await api.post(`/comms/queues/dlq/${id}/retry`, {})),
};

export const announcementService = {
  list: async (): Promise<Announcement[]> => unwrap<Announcement[]>(await api.get("/announcements")) ?? [],
  create: async (data: Partial<Announcement>): Promise<Announcement> => unwrap<Announcement>(await api.post("/announcements", data)),
  update: async (id: string, data: Partial<Announcement>): Promise<Announcement> => unwrap<Announcement>(await api.put(`/announcements/${id}`, data)),
  send: async (id: string): Promise<unknown> => unwrap(await api.post(`/announcements/${id}/send`, {})),
  cancel: async (id: string): Promise<unknown> => unwrap(await api.post(`/announcements/${id}/cancel`, {})),
  listMine: async (): Promise<{ items: { id: string; title: string; message: string; priority: string; sentAt: string; isRead: boolean }[]; unreadCount: number }> =>
    unwrap(await api.get("/announcements/me")),
  markRead: async (id: string): Promise<unknown> => unwrap(await api.patch(`/announcements/${id}/read`, {})),
};

export const chatService = {
  threads: async (): Promise<ChatThread[]> => unwrap<ChatThread[]>(await api.get("/communication/threads")) ?? [],
  memberMessages: async (memberId: string): Promise<ChatMessage[]> =>
    unwrap<ChatMessage[]>(await api.get(`/communication/messages/member/${memberId}`)) ?? [],
  myThread: async (): Promise<{ memberId: string; trainerId: string | null; messages: ChatMessage[] }> =>
    unwrap(await api.get("/communication/messages/me")),
  send: async (payload: { memberId: string; message: string }): Promise<ChatMessage> =>
    unwrap<ChatMessage>(await api.post("/communication/messages", payload)),
  markRead: async (memberId: string): Promise<unknown> => unwrap(await api.patch(`/communication/messages/member/${memberId}/read`, {})),

  // Admin <-> Trainer staff DM
  staffThread: async (trainerId: string): Promise<{ trainerId: string; name: string; messages: ChatMessage[] }> =>
    unwrap(await api.get(`/communication/staff-messages/${trainerId}`)),
  sendStaff: async (payload: { trainerId: string; message: string }): Promise<ChatMessage> =>
    unwrap<ChatMessage>(await api.post("/communication/staff-messages", payload)),
};
