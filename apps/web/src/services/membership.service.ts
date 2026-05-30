import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Membership } from '@/types/membership.types'

export interface MembershipListParams {
  gymId?: string
  memberId?: string
  status?: 'active' | 'expired' | 'paused'
  page?: number
  limit?: number
}

export interface CreateMembershipPayload {
  gymId: string
  memberId: string
  planName: string
  startDate: string
  endDate: string
  price: number
  status?: 'active' | 'expired' | 'paused'
}

export interface UpdateMembershipPayload {
  planName?: string
  startDate?: string
  endDate?: string
  price?: number
  status?: 'active' | 'expired' | 'paused'
}

export interface RenewMembershipPayload {
  durationDays: number
  price: number
  planName?: string
}

export interface MembershipListResponse {
  memberships: Membership[]
}

export const membershipService = {
  /**
   * List membership records with optional filters.
   * GET /memberships?gymId=&memberId=
   */
  list: async (params?: MembershipListParams): Promise<ApiResponse<MembershipListResponse>> => {
    const res = await api.get<ApiResponse<MembershipListResponse>>('/memberships', { params })
    return res.data
  },

  /**
   * Fetch a single membership by ID.
   * GET /memberships/:id
   */
  getById: async (id: string): Promise<ApiResponse<Membership>> => {
    const res = await api.get<ApiResponse<Membership>>(`/memberships/${id}`)
    return res.data
  },

  /**
   * Fetch the active membership for a specific member.
   * GET /memberships?gymId=&memberId=&status=active
   */
  getActiveMembership: async (memberId: string, gymId?: string): Promise<ApiResponse<Membership | null>> => {
    const res = await api.get<ApiResponse<MembershipListResponse>>('/memberships', {
      params: { memberId, gymId, status: 'active' },
    })
    const memberships = res.data.data?.memberships ?? []
    return {
      ...res.data,
      data: memberships[0] ?? null,
    }
  },

  /**
   * Create a new membership for a member.
   * POST /memberships
   */
  create: async (payload: CreateMembershipPayload): Promise<ApiResponse<Membership>> => {
    const res = await api.post<ApiResponse<Membership>>('/memberships', payload)
    return res.data
  },

  /**
   * Update an existing membership.
   * PUT /memberships/:id
   */
  update: async (id: string, payload: UpdateMembershipPayload): Promise<ApiResponse<Membership>> => {
    const res = await api.put<ApiResponse<Membership>>(`/memberships/${id}`, payload)
    return res.data
  },

  /**
   * Renew an existing membership by extending its end date.
   * POST /memberships/:id/renew
   */
  renew: async (id: string, payload: RenewMembershipPayload): Promise<ApiResponse<Membership>> => {
    const res = await api.post<ApiResponse<Membership>>(`/memberships/${id}/renew`, payload)
    return res.data
  },

  /**
   * Pause an active membership.
   * PATCH /memberships/:id/pause
   */
  pause: async (id: string): Promise<ApiResponse<Membership>> => {
    const res = await api.patch<ApiResponse<Membership>>(`/memberships/${id}/pause`)
    return res.data
  },

  /**
   * Resume a paused membership.
   * PATCH /memberships/:id/resume
   */
  resume: async (id: string): Promise<ApiResponse<Membership>> => {
    const res = await api.patch<ApiResponse<Membership>>(`/memberships/${id}/resume`)
    return res.data
  },

  /**
   * Delete a membership record.
   * DELETE /memberships/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/memberships/${id}`)
    return res.data
  },

  /**
   * Fetch the active membership for the currently logged-in member.
   * GET /memberships/my/active
   */
  getMyActive: async (): Promise<Membership | null> => {
    const res = await api.get<ApiResponse<Membership>>('/memberships/my/active')
    return res.data.data ?? null
  },
}
