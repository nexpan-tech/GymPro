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

/**
 * Normalize ANY notifications payload shape into a stable { items, unreadCount }.
 * The backend (or future changes) may return:
 *   - an array directly
 *   - { items: [] }            (current /notifications/me)
 *   - { data: [] }
 *   - { data: { items: [] } }
 *   - { items, unreadCount }
 * `items` is ALWAYS an array; `unreadCount` falls back to counting unread items.
 * Callers never touch a possibly-undefined field.
 */
export function normalizeNotifications(raw: unknown): MyNotifications {
  let items: Notification[] = [];
  let unreadCount: number | undefined;

  if (Array.isArray(raw)) {
    items = raw as Notification[];
  } else if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.items)) items = r.items as Notification[];
    else if (Array.isArray(r.data)) items = r.data as Notification[];
    else if (r.data && typeof r.data === 'object' && Array.isArray((r.data as Record<string, unknown>).items)) {
      items = (r.data as Record<string, unknown>).items as Notification[];
    }
    if (typeof r.unreadCount === 'number') unreadCount = r.unreadCount;
    else if (r.data && typeof r.data === 'object' && typeof (r.data as Record<string, unknown>).unreadCount === 'number') {
      unreadCount = (r.data as Record<string, unknown>).unreadCount as number;
    }
  }

  return {
    items,
    unreadCount: unreadCount ?? items.filter((n) => (n as { isRead?: boolean })?.isRead === false).length,
  };
}

/**
 * Member self-list as the stable { items, unreadCount } shape — for the
 * dashboard preview and the unread badge. Robust to any backend response shape.
 */
export async function getMyNotifications(
  params?: GetNotificationsParams,
): Promise<MyNotifications> {
  const res = await apiClient.get('/notifications/me', {
    params: params?.isRead === false ? { unreadOnly: true } : undefined,
  });
  return normalizeNotifications(unwrapApiResponse<unknown>(res));
}

/** Member self-list (Stage 9): GET /notifications/me, returned paginated for list screens. */
export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<PaginatedNotifications> {
  const res = await apiClient.get('/notifications/me', {
    params: params?.isRead === false ? { unreadOnly: true } : undefined,
  });
  const { items } = normalizeNotifications(unwrapApiResponse<unknown>(res));
  return { data: items, total: items.length, page: 1, limit: items.length };
}

/** Unread count for the badge. */
export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get('/notifications/me', { params: { unreadOnly: true } });
  return normalizeNotifications(unwrapApiResponse<unknown>(res)).unreadCount;
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
