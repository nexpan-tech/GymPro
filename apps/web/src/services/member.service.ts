import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Member } from '@/types/member.types'

export interface MemberListParams {
  gymId?: string
  branchId?: string
  search?: string
  page?: number
  limit?: number
  status?: 'active' | 'inactive'
  trainerId?: string
}

export interface CreateMemberPayload {
  name: string
  email: string
  password: string
  phone: string
  gender?: string
  dateOfBirth?: string
  address?: string
  height?: number
  weight?: number
  fitnessGoal?: string
  branchId?: string
  trainerId?: string
  // Health profile
  emergencyContactName?: string
  emergencyContactPhone?: string
  healthNotes?: string
  injuryNotes?: string
  medicalConditions?: string
}

export type UpdateMemberPayload = Partial<Omit<CreateMemberPayload, 'password'>> & {
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface MemberListResponse {
  members: Member[]
}

export const memberService = {
  /**
   * List members in the caller's gym. The backend returns a bare array; we
   * normalise it to `{ members }` so existing consumers keep working.
   * GET /members?branchId=
   */
  list: async (params?: MemberListParams): Promise<ApiResponse<MemberListResponse>> => {
    const res = await api.get<ApiResponse<Member[]>>('/members', {
      params: params?.branchId ? { branchId: params.branchId } : undefined,
    })
    return { ...res.data, data: { members: res.data.data ?? [] } }
  },

  /** GET /members/:id — full member detail incl. membership history. */
  getById: async (id: string): Promise<ApiResponse<Member>> => {
    const res = await api.get<ApiResponse<Member>>(`/members/${id}`)
    return res.data
  },

  /** POST /members — creates the member + linked login. */
  create: async (payload: CreateMemberPayload): Promise<ApiResponse<Member>> => {
    const res = await api.post<ApiResponse<Member>>('/members', payload)
    return res.data
  },

  /** PUT /members/:id */
  update: async (id: string, payload: UpdateMemberPayload): Promise<ApiResponse<Member>> => {
    const res = await api.put<ApiResponse<Member>>(`/members/${id}`, payload)
    return res.data
  },

  /** DELETE /members/:id — soft delete (INACTIVE) by default, or ?hard=true to permanently delete. */
  remove: async (id: string, hard = false): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/members/${id}`, {
      params: hard ? { hard: true } : undefined,
    })
    return res.data
  },

  /** POST /members/:id/reset-password — sets/generates a temp password (returned once). */
  resetPassword: async (
    id: string,
    password?: string,
  ): Promise<ApiResponse<{ temporaryPassword: string; generated: boolean }>> => {
    const res = await api.post<ApiResponse<{ temporaryPassword: string; generated: boolean }>>(
      `/members/${id}/reset-password`,
      password ? { password } : {},
    )
    return res.data
  },

  /** Fetch the current logged-in user's member profile. */
  getMyProfile: async (): Promise<Member | null> => {
    const res = await api.get<ApiResponse<Member>>('/members/me')
    return res.data.data ?? null
  },
}
