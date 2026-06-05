import { api } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type {
  Attendance,
  AttendanceAnalytics,
  LiveOccupancy,
  GymQr,
} from '@/types/attendance.types'

export interface MarkAttendancePayload {
  gymId?: string
  memberId: string
}

export interface AttendanceListResponse {
  attendance: Attendance[]
}

export const attendanceService = {
  // ── Admin / Receptionist dashboard ─────────────────────────────────────────
  /** Today's attendance for the caller's gym. */
  getToday: async (): Promise<Attendance[]> => {
    const res = await api.get<ApiResponse<Attendance[]>>('/attendance/today')
    return res.data.data ?? []
  },

  /** Members currently inside the gym + occupancy count. */
  getLive: async (): Promise<LiveOccupancy> => {
    const res = await api.get<ApiResponse<LiveOccupancy>>('/attendance/live')
    return res.data.data ?? { occupancy: 0, members: [] }
  },

  getAnalytics: async (days = 7): Promise<AttendanceAnalytics> => {
    const res = await api.get<ApiResponse<AttendanceAnalytics>>('/attendance/analytics', {
      params: { days },
    })
    return res.data.data
  },

  /** The printable gym QR (PNG data-url that encodes `gym:<gymId>`). */
  getQr: async (): Promise<GymQr> => {
    const res = await api.get<ApiResponse<GymQr>>('/attendance/qr')
    return res.data.data
  },

  /** Admin/receptionist manual check-in. */
  manualCheckIn: async (memberId: string): Promise<Attendance> => {
    const res = await api.post<ApiResponse<Attendance>>('/attendance/manual', { memberId })
    return res.data.data
  },

  /** Admin/receptionist check a member out. */
  checkOutMember: async (memberId: string): Promise<Attendance> => {
    const res = await api.post<ApiResponse<Attendance>>(`/attendance/member/${memberId}/checkout`)
    return res.data.data
  },

  // ── Member self-service ────────────────────────────────────────────────────
  getMyAttendance: async (): Promise<Attendance[]> => {
    const res = await api.get<ApiResponse<Attendance[]>>('/attendance/my')
    return res.data.data ?? []
  },

  checkout: async (): Promise<Attendance> => {
    const res = await api.post<ApiResponse<Attendance>>('/attendance/checkout')
    return res.data.data
  },

  // ── Shared ─────────────────────────────────────────────────────────────────
  getByMember: async (memberId: string): Promise<Attendance[]> => {
    const res = await api.get<ApiResponse<Attendance[]>>(`/attendance/member/${memberId}`)
    return res.data.data ?? []
  },

  /**
   * Legacy helper used by the trainer dashboard: returns the gym's attendance
   * for a date wrapped in `{ attendance }`. (gymId is derived from the JWT.)
   */
  getByDate: async (
    _gymId: string,
    date?: string
  ): Promise<ApiResponse<AttendanceListResponse>> => {
    const res = await api.get<ApiResponse<Attendance[]>>('/attendance/today', {
      params: date ? { date } : undefined,
    })
    return { ...res.data, data: { attendance: res.data.data ?? [] } }
  },

  /** Legacy: manual mark used by the old AttendanceForm. */
  mark: async (payload: MarkAttendancePayload): Promise<Attendance> => {
    return attendanceService.manualCheckIn(payload.memberId)
  },

  /** Legacy: kept for the old AttendanceTable component. */
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`/attendance/${id}`)
    return res.data
  },
}
