import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Member } from '@/types/member.types'

export interface MemberListParams {
  gymId?: string
  search?: string
  page?: number
  limit?: number
  status?: 'active' | 'inactive'
  trainerId?: string
}

export interface CreateMemberPayload {
  gymId: string
  userId?: string
  phone: string
  gender?: string
  dateOfBirth?: string
  address?: string
  height?: number
  weight?: number
  fitnessGoal?: string
  trainerId?: string
  // Inline user creation when userId is not provided
  name?: string
  email?: string
  password?: string
}

export interface UpdateMemberPayload {
  phone?: string
  gender?: string
  dateOfBirth?: string
  address?: string
  height?: number
  weight?: number
  fitnessGoal?: string
  trainerId?: string
}

export interface MemberListResponse {
  members: Member[]
}

export const memberService = {
  /**
   * List all members with optional filtering and pagination.
   * GET /members?gymId=&search=&page=&limit=
   */
  list: async (params?: MemberListParams): Promise<ApiResponse<MemberListResponse>> => {
    const res = await api.get<ApiResponse<MemberListResponse>>('/members', { params })
    return res.data
  },

  /**
   * Fetch a single member by ID.
   * GET /members/:id
   */
  getById: async (id: string): Promise<ApiResponse<Member>> => {
    const res = await api.get<ApiResponse<Member>>(`/members/${id}`)
    return res.data
  },

  /**
   * Create a new member record.
   * POST /members
   */
  create: async (payload: CreateMemberPayload): Promise<ApiResponse<Member>> => {
    const res = await api.post<ApiResponse<Member>>('/members', payload)
    return res.data
  },

  /**
   * Update an existing member by ID.
   * PUT /members/:id
   */
  update: async (id: string, payload: UpdateMemberPayload): Promise<ApiResponse<Member>> => {
    const res = await api.put<ApiResponse<Member>>(`/members/${id}`, payload)
    return res.data
  },

  /**
   * Delete a member by ID.
   * DELETE /members/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/members/${id}`)
    return res.data
  },

  /**
   * Assign a trainer to a member.
   * PATCH /members/:id/assign-trainer
   */
  assignTrainer: async (memberId: string, trainerId: string): Promise<ApiResponse<Member>> => {
    const res = await api.patch<ApiResponse<Member>>(`/members/${memberId}/assign-trainer`, { trainerId })
    return res.data
  },

  /**
   * Fetch the current logged-in user's member profile.
   * GET /members/me
   */
  getMyProfile: async (): Promise<Member | null> => {
    const res = await api.get<ApiResponse<Member>>('/members/me')
    return res.data.data ?? null
  },
}
