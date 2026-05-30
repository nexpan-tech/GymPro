import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Trainer } from '@/types/user.types'

export interface TrainerListParams {
  gymId?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateTrainerPayload {
  gymId: string
  name: string
  email: string
  password: string
  phone?: string
  specialization?: string
  experience?: number
  avatar?: string
}

export interface UpdateTrainerPayload {
  name?: string
  phone?: string
  specialization?: string
  experience?: number
  avatar?: string
  isActive?: boolean
}

export interface TrainerListResponse {
  trainers: Trainer[]
}

export interface TrainerStats {
  totalMembers: number
  activeMembers: number
  sessionsThisMonth: number
}

export const trainerService = {
  /**
   * List all trainers for a gym.
   * GET /trainers?gymId=
   */
  list: async (params?: TrainerListParams): Promise<ApiResponse<TrainerListResponse>> => {
    const res = await api.get<ApiResponse<TrainerListResponse>>('/trainers', { params })
    return res.data
  },

  /**
   * Fetch a single trainer by ID.
   * GET /trainers/:id
   */
  getById: async (id: string): Promise<ApiResponse<Trainer>> => {
    const res = await api.get<ApiResponse<Trainer>>(`/trainers/${id}`)
    return res.data
  },

  /**
   * Create a new trainer account.
   * POST /trainers
   */
  create: async (payload: CreateTrainerPayload): Promise<ApiResponse<Trainer>> => {
    const res = await api.post<ApiResponse<Trainer>>('/trainers', payload)
    return res.data
  },

  /**
   * Update a trainer's profile.
   * PUT /trainers/:id
   */
  update: async (id: string, payload: UpdateTrainerPayload): Promise<ApiResponse<Trainer>> => {
    const res = await api.put<ApiResponse<Trainer>>(`/trainers/${id}`, payload)
    return res.data
  },

  /**
   * Remove a trainer by ID.
   * DELETE /trainers/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/trainers/${id}`)
    return res.data
  },

  /**
   * Fetch performance stats for a specific trainer.
   * GET /trainers/:id/stats
   */
  getStats: async (id: string): Promise<ApiResponse<TrainerStats>> => {
    const res = await api.get<ApiResponse<TrainerStats>>(`/trainers/${id}/stats`)
    return res.data
  },

  /**
   * List all members assigned to a specific trainer.
   * GET /trainers/:id/members
   */
  getMembers: async (id: string, gymId?: string): Promise<ApiResponse<{ members: unknown[] }>> => {
    const res = await api.get<ApiResponse<{ members: unknown[] }>>(`/trainers/${id}/members`, {
      params: gymId ? { gymId } : undefined,
    })
    return res.data
  },
}
