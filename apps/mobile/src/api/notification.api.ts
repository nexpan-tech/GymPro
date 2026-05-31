import { apiClient } from './client';
import { unwrapApiResponse, unwrapPaginatedResponse } from '../lib/api-response';
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

export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<PaginatedNotifications> {
  const res = await apiClient.get('/notifications', { params });
  return unwrapPaginatedResponse<Notification>(res);
}

export async function markRead(id: string): Promise<Notification> {
  const res = await apiClient.patch(`/notifications/${id}/mark-read`);
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
