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
   * Quick numeric stats for the top stat cards.
   *
   * The backend only exposes a flat `/analytics/dashboard` aggregate (there is
   * no `/analytics/stats`), so we map that here. Fields the backend doesn't
   * compute default to 0 — the dashboard renders them gracefully.
   */
  getStats: async (params?: DashboardParams): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get<ApiResponse<{ totalMembers?: number; activeMemberships?: number; totalRevenue?: number }>>(
      '/analytics/dashboard',
      { params },
    )
    const a = res.data.data ?? {}
    return {
      success: true,
      data: {
        totalMembers: a.totalMembers ?? 0,
        activeMembers: a.activeMemberships ?? 0,
        newMembersThisMonth: 0,
        totalRevenue: a.totalRevenue ?? 0,
        revenueThisMonth: 0,
        attendanceToday: 0,
        activeSessions: 0,
        pendingDues: 0,
        openLeads: 0,
        expiringMemberships: 0,
      },
    }
  },

  /**
   * Recent activity feed. No backend endpoint exists yet, so return an empty
   * feed (the dashboard shows an empty state) rather than 404-ing.
   */
  getRecentActivity: async (
    _params?: DashboardParams & { limit?: number },
  ): Promise<ApiResponse<RecentActivity[]>> => {
    return { success: true, data: [] }
  },

  /**
   * Gym-level dashboard summary. Charts fall back to placeholders when these
   * arrays are empty; only `/analytics/dashboard` exists on the backend so we
   * return the chart-shaped arrays empty rather than hitting a 404.
   */
  getGymDashboard: async (
    _gymId: string,
    _params?: Omit<DashboardParams, 'gymId'>,
  ): Promise<ApiResponse<DashboardAnalytics>> => {
    return {
      success: true,
      data: { stats: [], revenue: [], attendance: [], memberships: [], recentActivity: [] },
    }
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
