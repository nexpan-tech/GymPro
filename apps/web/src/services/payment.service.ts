import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Payment } from '@/types/payment.types'

export interface PaymentListParams {
  gymId?: string
  memberId?: string
  status?: 'PAID' | 'PENDING' | 'OVERDUE'
  method?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreatePaymentPayload {
  gymId: string
  memberId: string
  membershipId?: string
  amount: number
  method?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'
  status?: 'PAID' | 'PENDING' | 'OVERDUE'
  paidAt?: string
  notes?: string
}

export interface UpdatePaymentPayload {
  amount?: number
  method?: string
  status?: 'PAID' | 'PENDING' | 'OVERDUE'
  paidAt?: string
  notes?: string
}

export interface PaymentListResponse {
  payments: Payment[]
}

export interface PaymentSummary {
  totalRevenue: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  transactionCount: number
}

export const paymentService = {
  /**
   * List payment records with optional filtering and pagination.
   * GET /payments?gymId=&page=&limit=
   */
  list: async (params?: PaymentListParams): Promise<ApiResponse<PaymentListResponse>> => {
    const res = await api.get<ApiResponse<PaymentListResponse>>('/payments', { params })
    return res.data
  },

  /**
   * Fetch a single payment by ID.
   * GET /payments/:id
   */
  getById: async (id: string): Promise<ApiResponse<Payment>> => {
    const res = await api.get<ApiResponse<Payment>>(`/payments/${id}`)
    return res.data
  },

  /**
   * Create a new payment record.
   * POST /payments
   */
  create: async (payload: CreatePaymentPayload): Promise<ApiResponse<Payment>> => {
    const res = await api.post<ApiResponse<Payment>>('/payments', payload)
    return res.data
  },

  /**
   * Update an existing payment record.
   * PUT /payments/:id
   */
  update: async (id: string, payload: UpdatePaymentPayload): Promise<ApiResponse<Payment>> => {
    const res = await api.put<ApiResponse<Payment>>(`/payments/${id}`, payload)
    return res.data
  },

  /**
   * Delete a payment record by ID.
   * DELETE /payments/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/payments/${id}`)
    return res.data
  },

  /**
   * Mark a pending payment as paid.
   * PATCH /payments/:id/mark-paid
   */
  markPaid: async (id: string, paidAt?: string): Promise<ApiResponse<Payment>> => {
    const res = await api.patch<ApiResponse<Payment>>(`/payments/${id}/mark-paid`, { paidAt })
    return res.data
  },

  /**
   * Fetch payment summary/aggregates for a gym.
   * GET /payments/summary?gymId=&startDate=&endDate=
   */
  getSummary: async (gymId: string, startDate?: string, endDate?: string): Promise<ApiResponse<PaymentSummary>> => {
    const res = await api.get<ApiResponse<PaymentSummary>>('/payments/summary', {
      params: { gymId, startDate, endDate },
    })
    return res.data
  },

  /**
   * List payments for a specific member.
   * GET /payments?gymId=&memberId=
   */
  getByMember: async (memberId: string, gymId?: string): Promise<ApiResponse<PaymentListResponse>> => {
    const res = await api.get<ApiResponse<PaymentListResponse>>('/payments', {
      params: { memberId, gymId },
    })
    return res.data
  },
}
