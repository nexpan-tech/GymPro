import { apiClient } from './client';
import { unwrapApiResponse } from '../lib/api-response';
import type { Notification } from '../types/notification.types';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface MyNotifications {
  items: Notification[];
  unreadCount: number;
}

/** Member self-list (Stage 9): GET /notifications/me → { items, unreadCount }. */
export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<PaginatedNotifications> {
  const res = await apiClient.get('/notifications/me', {
    params: params?.isRead === false ? { unreadOnly: true } : undefined,
  });
  const data = unwrapApiResponse<MyNotifications>(res);
  const items = Array.isArray(data?.items) ? data.items : [];
  return { data: items, total: items.length, page: 1, limit: items.length };
}

/** Unread count for the badge. */
export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get('/notifications/me', { params: { unreadOnly: true } });
  const data = unwrapApiResponse<MyNotifications>(res);
  return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
}

export async function markRead(id: string): Promise<Notification> {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return unwrapApiResponse<Notification>(res);
}

export async function markAllRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

export async function registerPushToken(
  token: string,
  platform: string,
): Promise<void> {
  await apiClient.post('/push/register-token', { token, platform });
}
