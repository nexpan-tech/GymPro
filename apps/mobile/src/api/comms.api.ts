import { apiClient } from './client';
import { unwrapApiResponse, unwrapListResponse } from '../lib/api-response';

// ── Announcements ──
export interface MemberAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sentAt: string | null;
  isRead: boolean;
}

export async function getMyAnnouncements(): Promise<{ items: MemberAnnouncement[]; unreadCount: number }> {
  const res = await apiClient.get('/announcements/me');
  const data = unwrapApiResponse<{ items: MemberAnnouncement[]; unreadCount: number }>(res);
  return { items: Array.isArray(data?.items) ? data.items : [], unreadCount: data?.unreadCount ?? 0 };
}

export async function markAnnouncementRead(id: string): Promise<void> {
  await apiClient.patch(`/announcements/${id}/read`);
}

// ── Chat ──
export interface ChatMessage {
  id: string;
  memberId: string;
  trainerId: string;
  senderId: string;
  type: string;
  message: string;
  createdAt: string;
  sender?: { id: string; name: string; role: string };
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
}

/** Member's chattable staff (trainer + admins) with unread counts. (Phase F) */
export async function getChatContacts(): Promise<{ memberId: string; contacts: ChatContact[] }> {
  const res = await apiClient.get('/communication/contacts');
  const data = unwrapApiResponse<{ memberId: string; contacts: ChatContact[] }>(res);
  return { memberId: data?.memberId, contacts: Array.isArray(data?.contacts) ? data.contacts : [] };
}

export async function getMyThread(withStaffId?: string): Promise<{ memberId: string; trainerId: string | null; messages: ChatMessage[] }> {
  const res = await apiClient.get(`/communication/messages/me${withStaffId ? `?with=${withStaffId}` : ''}`);
  const data = unwrapApiResponse<{ memberId: string; trainerId: string | null; messages: ChatMessage[] }>(res);
  return { memberId: data?.memberId, trainerId: data?.trainerId ?? null, messages: Array.isArray(data?.messages) ? data.messages : [] };
}

export async function sendChatMessage(memberId: string, message: string, trainerId?: string): Promise<ChatMessage> {
  const res = await apiClient.post('/communication/messages', { memberId, message, ...(trainerId ? { trainerId } : {}) });
  return unwrapApiResponse<ChatMessage>(res);
}

export async function markThreadRead(memberId: string): Promise<void> {
  await apiClient.patch(`/communication/messages/member/${memberId}/read`);
}

export { unwrapListResponse };
