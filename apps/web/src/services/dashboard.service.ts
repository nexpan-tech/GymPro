import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type {
  DashboardAnalytics,
  DashboardStats,
  StatCardData,
  Activity,
} from '@/types/analytics.types'

export interface DashboardParams {
  gymId?: string
  branchId?: string
  period?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}

export interface QuickStats {
  totalMembers: number
  activeMembers: number
  attendanceToday: number
  revenueThisMonth: number
  pendingDues: number
  expiringMemberships: number
  newMembersThisWeek: number
  activeSessions: number
}

export interface RecentActivity extends Activity {
  type?: string
  userId?: string
  gymId?: string
}

export interface DashboardOverview {
  stats: QuickStats
  statCards: StatCardData[]
  recentActivity: RecentActivity[]
}

export const dashboardService = {
  /**
   * Fetch the full aggregated dashboard data for the current user's role.
   * GET /analytics/dashboard
   */
  getOverview: async (params?: DashboardParams): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>('/analytics/dashboard', { params })
    return res.data
  },

  /**
   * Fetch quick numeric stats for the top stat cards.
   * GET /analytics/stats?gymId=
   */
  getStats: async (params?: DashboardParams): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get<ApiResponse<DashboardStats>>('/analytics/stats', { params })
    return res.data
  },

  /**
   * Fetch recent activity feed for the dashboard timeline.
   * GET /analytics/activity?gymId=&limit=
   */
  getRecentActivity: async (params?: DashboardParams & { limit?: number }): Promise<ApiResponse<RecentActivity[]>> => {
    const res = await api.get<ApiResponse<RecentActivity[]>>('/analytics/activity', { params })
    return res.data
  },

  /**
   * Fetch gym-level dashboard summary (for gym admin role).
   * GET /analytics/gym/:gymId
   */
  getGymDashboard: async (gymId: string, params?: Omit<DashboardParams, 'gymId'>): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>(`/analytics/gym/${gymId}`, { params })
    return res.data
  },

  /**
   * Fetch trainer dashboard (sessions, assigned members, today's schedule).
   * GET /analytics/trainer/:trainerId
   */
  getTrainerDashboard: async (trainerId: string, params?: Omit<DashboardParams, 'gymId'>): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>(`/analytics/trainer/${trainerId}`, { params })
    return res.data
  },

  /**
   * Fetch member dashboard (membership status, attendance streak, upcoming sessions).
   * GET /analytics/member/:memberId
   */
  getMemberDashboard: async (memberId: string): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>(`/analytics/member/${memberId}`)
    return res.data
  },

  /**
   * Fetch super-admin platform-wide dashboard.
   * GET /analytics/super-admin
   */
  getSuperAdminDashboard: async (params?: DashboardParams): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>('/analytics/super-admin', { params })
    return res.data
  },
}
