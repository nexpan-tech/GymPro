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

// Trainers are Users with role TRAINER. There is no dedicated `/trainers` CRUD
// API on the backend (the `/trainers` path serves trainer-analytics), so these
// methods are backed by the gym-scoped `/users` endpoints and filtered by role.
const TRAINER_ROLE = 'TRAINER'

export const trainerService = {
  /**
   * List all trainers in the caller's gym.
   * GET /users (filtered to role TRAINER)
   */
  list: async (_params?: TrainerListParams): Promise<ApiResponse<TrainerListResponse>> => {
    const res = await api.get<ApiResponse<Array<{ role: string }>>>('/users')
    const all = res.data.data ?? []
    const trainers = all.filter((u) => u.role === TRAINER_ROLE) as unknown as Trainer[]
    return { success: true, message: res.data.message, data: { trainers } }
  },

  /**
   * Fetch a single trainer by ID.
   * GET /users/:id is not exposed; fall back to filtering the list.
   */
  getById: async (id: string): Promise<ApiResponse<Trainer>> => {
    const { data } = await trainerService.list()
    const trainer = data.trainers.find((t) => t.id === id)
    return { success: !!trainer, data: trainer as Trainer }
  },

  /**
   * Create a new trainer account.
   * POST /users with role TRAINER
   */
  create: async (payload: CreateTrainerPayload): Promise<ApiResponse<Trainer>> => {
    const res = await api.post<ApiResponse<Trainer>>('/users', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: TRAINER_ROLE,
    })
    return res.data
  },

  /**
   * Update a trainer's profile.
   * PUT /users/:id
   */
  update: async (id: string, payload: UpdateTrainerPayload): Promise<ApiResponse<Trainer>> => {
    const res = await api.put<ApiResponse<Trainer>>(`/users/${id}`, {
      name: payload.name,
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    })
    return res.data
  },

  /**
   * Remove a trainer by ID.
   * DELETE /users/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/users/${id}`)
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
