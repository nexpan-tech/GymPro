import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type {
  DashboardAnalytics,
  StatCardData,
  RevenueData,
  AttendanceStats,
  MembershipPoint,
} from '@/types/analytics.types'

export interface GymAnalyticsParams {
  startDate?: string
  endDate?: string
  period?: 'day' | 'week' | 'month' | 'year'
}

export interface RevenueAnalytics {
  totalRevenue: number
  revenueByPeriod: RevenueData[]
  revenueByMethod: { method: string; amount: number }[]
  growthRate: number
}

export interface MemberGrowthAnalytics {
  totalMembers: number
  newMembersThisPeriod: number
  churnRate: number
  retentionRate: number
  membersByPlan: { planName: string; count: number }[]
}

export interface AttendanceAnalytics {
  averageDailyAttendance: number
  peakHours: { hour: number; count: number }[]
  attendanceByDay: AttendanceStats[]
  attendanceRate: number
}

export interface MembershipAnalytics {
  activeMemberships: number
  expiredMemberships: number
  expiringThisWeek: number
  membershipsByPlan: MembershipPoint[]
}

export interface FullGymAnalytics {
  stats: StatCardData[]
  revenue: RevenueAnalytics
  memberGrowth: MemberGrowthAnalytics
  attendance: AttendanceAnalytics
  memberships: MembershipAnalytics
}

export const analyticsService = {
  /**
   * Fetch aggregated analytics for a gym.
   * GET /analytics/gym/:gymId
   */
  getGymAnalytics: async (gymId: string, params?: GymAnalyticsParams): Promise<ApiResponse<FullGymAnalytics>> => {
    const res = await api.get<ApiResponse<FullGymAnalytics>>(`/analytics/gym/${gymId}`, { params })
    return res.data
  },

  /**
   * Fetch revenue breakdown for a gym.
   * GET /analytics/revenue/:gymId
   */
  getRevenue: async (gymId: string, params?: GymAnalyticsParams): Promise<ApiResponse<RevenueAnalytics>> => {
    const res = await api.get<ApiResponse<RevenueAnalytics>>(`/analytics/revenue/${gymId}`, { params })
    return res.data
  },

  /**
   * Fetch member growth analytics for a gym.
   * GET /analytics/members/:gymId
   */
  getMemberGrowth: async (gymId: string, params?: GymAnalyticsParams): Promise<ApiResponse<MemberGrowthAnalytics>> => {
    const res = await api.get<ApiResponse<MemberGrowthAnalytics>>(`/analytics/members/${gymId}`, { params })
    return res.data
  },

  /**
   * Fetch attendance analytics for a gym.
   * GET /analytics/attendance/:gymId
   */
  getAttendanceAnalytics: async (gymId: string, params?: GymAnalyticsParams): Promise<ApiResponse<AttendanceAnalytics>> => {
    const res = await api.get<ApiResponse<AttendanceAnalytics>>(`/analytics/attendance/${gymId}`, { params })
    return res.data
  },

  /**
   * Fetch the aggregated dashboard analytics for the current role.
   * GET /analytics/dashboard
   */
  getDashboard: async (): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>('/analytics/dashboard')
    return res.data
  },

  /**
   * Fetch analytics for a trainer's performance.
   * GET /analytics/trainer/:trainerId
   */
  getTrainerAnalytics: async (trainerId: string, params?: GymAnalyticsParams): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>(`/analytics/trainer/${trainerId}`, { params })
    return res.data
  },

  /**
   * Fetch platform-wide analytics for super admin.
   * GET /analytics/super-admin
   */
  getSuperAdminAnalytics: async (params?: GymAnalyticsParams): Promise<ApiResponse<DashboardAnalytics>> => {
    const res = await api.get<ApiResponse<DashboardAnalytics>>('/analytics/super-admin', { params })
    return res.data
  },
}
