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
   * Member self-service payment history.
   * GET /payments/my  (the gym-wide /payments list is ADMIN/RECEPTIONIST only)
   */
  getMy: async (): Promise<ApiResponse<PaymentListResponse>> => {
    const res = await api.get<ApiResponse<Payment[]>>('/payments/my')
    return { ...res.data, data: { payments: res.data.data ?? [] } }
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
   * Payment summary/aggregates for a gym. There is no `/payments/summary`
   * endpoint, so aggregate from the payments list client-side.
   */
  getSummary: async (gymId: string, startDate?: string, endDate?: string): Promise<ApiResponse<PaymentSummary>> => {
    const res = await api.get<ApiResponse<PaymentListResponse>>('/payments', {
      params: { gymId, startDate, endDate },
    })
    const payments = res.data.data?.payments ?? []
    const sumWhere = (s: string) =>
      payments
        .filter((p) => (p as { status?: string }).status === s)
        .reduce((t, p) => t + (Number((p as { amount?: number }).amount) || 0), 0)
    const totalRevenue = payments.reduce(
      (t, p) => t + (Number((p as { amount?: number }).amount) || 0),
      0,
    )
    return {
      success: true,
      data: {
        totalRevenue,
        totalPaid: sumWhere('PAID'),
        totalPending: sumWhere('PENDING'),
        totalOverdue: sumWhere('OVERDUE'),
        transactionCount: payments.length,
      },
    }
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
