import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { Attendance } from '@/types/attendance.types'

export interface AttendanceListParams {
  gymId?: string
  memberId?: string
  date?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface MarkAttendancePayload {
  gymId: string
  memberId: string
  checkInAt?: string
  date?: string
}

export interface QrScanPayload {
  gymId: string
  qrCode: string
}

export interface AttendanceListResponse {
  attendance: Attendance[]
}

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  attendanceRate: number
}

export const attendanceService = {
  /**
   * List attendance records with optional filters.
   * GET /attendance?gymId=&memberId=&date=
   */
  list: async (params?: AttendanceListParams): Promise<ApiResponse<AttendanceListResponse>> => {
    const res = await api.get<ApiResponse<AttendanceListResponse>>('/attendance', { params })
    return res.data
  },

  /**
   * Fetch attendance records for a specific member.
   * GET /attendance?gymId=&memberId=
   */
  getByMember: async (memberId: string, gymId?: string, params?: Pick<AttendanceListParams, 'startDate' | 'endDate' | 'page' | 'limit'>): Promise<ApiResponse<AttendanceListResponse>> => {
    const res = await api.get<ApiResponse<AttendanceListResponse>>('/attendance', {
      params: { memberId, gymId, ...params },
    })
    return res.data
  },

  /**
   * Fetch attendance for a specific date across a gym.
   * GET /attendance?gymId=&date=
   */
  getByDate: async (gymId: string, date: string): Promise<ApiResponse<AttendanceListResponse>> => {
    const res = await api.get<ApiResponse<AttendanceListResponse>>('/attendance', {
      params: { gymId, date },
    })
    return res.data
  },

  /**
   * Manually mark attendance for a member.
   * POST /attendance
   */
  mark: async (payload: MarkAttendancePayload): Promise<ApiResponse<Attendance>> => {
    const res = await api.post<ApiResponse<Attendance>>('/attendance', payload)
    return res.data
  },

  /**
   * Record attendance via QR code scan.
   * POST /attendance/scan
   */
  scanQr: async (payload: QrScanPayload): Promise<ApiResponse<Attendance>> => {
    const res = await api.post<ApiResponse<Attendance>>('/attendance/scan', payload)
    return res.data
  },

  /**
   * Fetch today's attendance for the authenticated member.
   * GET /attendance/my
   */
  getMyAttendance: async (): Promise<ApiResponse<AttendanceListResponse>> => {
    const res = await api.get<ApiResponse<AttendanceListResponse>>('/attendance/my')
    return res.data
  },

  /**
   * Fetch attendance summary/stats for a member over a date range.
   * GET /attendance/summary?memberId=&gymId=&startDate=&endDate=
   */
  getSummary: async (memberId: string, gymId: string, startDate: string, endDate: string): Promise<ApiResponse<AttendanceSummary>> => {
    const res = await api.get<ApiResponse<AttendanceSummary>>('/attendance/summary', {
      params: { memberId, gymId, startDate, endDate },
    })
    return res.data
  },

  /**
   * Delete an attendance record by ID.
   * DELETE /attendance/:id
   */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/attendance/${id}`)
    return res.data
  },
}
