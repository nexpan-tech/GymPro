import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'

export type NotificationAudience = 'ALL' | 'MEMBERS' | 'TRAINERS' | 'STAFF'

export interface Notification {
  id: string
  gymId?: string
  memberId?: string
  title: string
  message: string
  audience: NotificationAudience
  isRead: boolean
  createdAt: string
  updatedAt?: string
}

export interface NotificationListParams {
  memberId?: string
  gymId?: string
  isRead?: boolean
  page?: number
  limit?: number
}

export interface CreateNotificationPayload {
  gymId?: string
  memberId?: string
  title: string
  message: string
  audience: NotificationAudience
}

export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
}

export const notificationService = {
  /**
   * List notifications for a member or gym.
   * GET /notifications?memberId=&gymId=
   */
  list: async (params?: NotificationListParams): Promise<ApiResponse<NotificationListResponse>> => {
    const res = await api.get<ApiResponse<NotificationListResponse>>('/notifications', { params })
    return res.data
  },

  /**
   * Fetch a single notification by ID.
   * GET /notifications/:id
   */
  getById: async (id: string): Promise<ApiResponse<Notification>> => {
    const res = await api.get<ApiResponse<Notification>>(`/notifications/${id}`)
    return res.data
  },

  /**
   * Mark a single notification as read.
   * POST /notifications/:id/read
   */
  markRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const res = await api.post<ApiResponse<Notification>>(`/notifications/${id}/read`)
    return res.data
  },

  /**
   * Mark all notifications as read for the current user.
   * POST /notifications/mark-all-read
   */
  markAllRead: async (params?: { memberId?: string; gymId?: string }): Promise<ApiResponse<null>> => {
    const res = await api.post<ApiResponse<null>>('/notifications/mark-all-read', params)
    return res.data
  },

  /**
   * Create a new notification (admin broadcast).
   * POST /notifications
   */
  create: async (payload: CreateNotificationPayload): Promise<ApiResponse<Notification>> => {
    const res = await api.post<ApiResponse<Notification>>('/notifications', payload)
    return res.data
  },

  /**
   * Delete a notification by ID.
   * DELETE /notifications/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/notifications/${id}`)
    return res.data
  },

  /**
   * Fetch the count of unread notifications for the current user.
   * GET /notifications/unread-count
   */
  getUnreadCount: async (params?: { memberId?: string; gymId?: string }): Promise<ApiResponse<{ count: number }>> => {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count', { params })
    return res.data
  },
}
