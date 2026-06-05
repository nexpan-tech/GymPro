import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'

// ─── Types (match the Stage 2 backend contract) ──────────────────────────────

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED'
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE'

export interface MembershipPlan {
  id: string
  gymId: string
  branchId?: string | null
  name: string
  description?: string | null
  durationDays: number
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MembershipRecord {
  id: string
  gymId: string
  memberId: string
  planId?: string | null
  planRef?: MembershipPlan | null
  plan?: string | null
  startDate: string
  endDate: string
  amount: number
  paymentStatus: PaymentStatus
  status: MembershipStatus
  effectiveStatus: MembershipStatus
  daysRemaining: number
  freezeStartDate?: string | null
  freezeEndDate?: string | null
  extensionDays: number
  renewedFromId?: string | null
  createdAt: string
  member?: { id: string; user?: { name: string; email: string } }
}

export interface MembershipAnalytics {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  expiredMembers: number
  activeMemberships: number
  expiredMemberships: number
  frozenMemberships: number
  renewalsDueThisWeek: number
  renewalsDueThisMonth: number
  branchCounts: { branchId: string; branchName: string; memberCount: number }[]
}

export interface CreateMembershipPayload {
  memberId: string
  planId?: string
  plan?: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
  startDate?: string
  amount?: number
  paymentStatus?: PaymentStatus
}

export interface RenewMembershipPayload {
  planId?: string
  startDate?: string
  amount?: number
  paymentStatus?: PaymentStatus
}

export interface CreatePlanPayload {
  name: string
  description?: string
  durationDays: number
  price: number
  branchId?: string
  isActive?: boolean
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const membershipService = {
  // Memberships ---------------------------------------------------------------
  list: async (params: { currentOnly?: boolean } = {}): Promise<MembershipRecord[]> => {
    const res = await api.get<ApiResponse<MembershipRecord[]>>('/memberships', {
      params: params.currentOnly ? { currentOnly: true } : undefined,
    })
    return res.data.data ?? []
  },

  getByMember: async (memberId: string): Promise<MembershipRecord[]> => {
    const res = await api.get<ApiResponse<MembershipRecord[]>>(`/memberships/member/${memberId}`)
    return res.data.data ?? []
  },

  create: async (payload: CreateMembershipPayload): Promise<MembershipRecord> => {
    const res = await api.post<ApiResponse<MembershipRecord>>('/memberships', payload)
    return res.data.data
  },

  renew: async (id: string, payload: RenewMembershipPayload = {}): Promise<MembershipRecord> => {
    const res = await api.post<ApiResponse<MembershipRecord>>(`/memberships/${id}/renew`, payload)
    return res.data.data
  },

  freeze: async (
    id: string,
    payload: { freezeStartDate?: string; freezeEndDate?: string } = {}
  ): Promise<MembershipRecord> => {
    const res = await api.post<ApiResponse<MembershipRecord>>(`/memberships/${id}/freeze`, payload)
    return res.data.data
  },

  extend: async (id: string, days: number): Promise<MembershipRecord> => {
    const res = await api.post<ApiResponse<MembershipRecord>>(`/memberships/${id}/extend`, { days })
    return res.data.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/memberships/${id}`)
  },

  analytics: async (): Promise<MembershipAnalytics> => {
    const res = await api.get<ApiResponse<MembershipAnalytics>>('/memberships/analytics')
    return res.data.data
  },

  // Member self-service -------------------------------------------------------
  getMy: async (): Promise<{ current: MembershipRecord | null; history: MembershipRecord[] }> => {
    const res = await api.get<ApiResponse<{ current: MembershipRecord | null; history: MembershipRecord[] }>>(
      '/memberships/my'
    )
    return res.data.data ?? { current: null, history: [] }
  },

  getMyActive: async (): Promise<MembershipRecord | null> => {
    const { current } = await membershipService.getMy()
    return current
  },

  // Plans ---------------------------------------------------------------------
  listPlans: async (includeInactive = true): Promise<MembershipPlan[]> => {
    const res = await api.get<ApiResponse<MembershipPlan[]>>('/memberships/plans', {
      params: { includeInactive },
    })
    return res.data.data ?? []
  },

  createPlan: async (payload: CreatePlanPayload): Promise<MembershipPlan> => {
    const res = await api.post<ApiResponse<MembershipPlan>>('/memberships/plans', payload)
    return res.data.data
  },

  updatePlan: async (id: string, payload: Partial<CreatePlanPayload>): Promise<MembershipPlan> => {
    const res = await api.patch<ApiResponse<MembershipPlan>>(`/memberships/plans/${id}`, payload)
    return res.data.data
  },

  removePlan: async (id: string): Promise<void> => {
    await api.delete(`/memberships/plans/${id}`)
  },
}
