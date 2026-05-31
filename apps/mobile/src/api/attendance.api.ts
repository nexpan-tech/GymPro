import { apiClient } from './client';
import {
  unwrapApiResponse,
  unwrapListResponse,
  unwrapPaginatedResponse,
} from '../lib/api-response';

export interface AttendanceRecord {
  id: string;
  userId: string;
  gymId: string;
  checkInAt: string;
  checkOutAt?: string | null;
  method?: string;
}

export interface AttendanceStreak {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
}

export interface GetAttendanceParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAttendance {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function scanQrAttendance(
  qrPayload: string,
): Promise<AttendanceRecord> {
  const res = await apiClient.post('/qr-attendance/scan', { qrPayload });
  return unwrapApiResponse<AttendanceRecord>(res);
}

export async function getMyAttendance(
  params?: GetAttendanceParams,
): Promise<PaginatedAttendance> {
  const res = await apiClient.get('/attendance', { params });
  return unwrapPaginatedResponse<AttendanceRecord>(res);
}

export async function getAttendanceStreak(): Promise<AttendanceStreak> {
  try {
    const res = await apiClient.get('/analytics/attendance-streak');
    return unwrapApiResponse<AttendanceStreak>(res);
  } catch {
    // Fallback: compute streak from the attendance list if the dedicated
    // endpoint is not available.
    const res = await apiClient.get('/attendance', { params: { limit: 365 } });
    const records = unwrapListResponse<AttendanceRecord>(res);

    if (records.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastCheckIn: null };
    }

    // Collect unique check-in dates (YYYY-MM-DD), sorted descending.
    const dates = [
      ...new Set(records.map((r) => r.checkInAt.substring(0, 10))),
    ].sort((a, b) => b.localeCompare(a));

    const today = new Date().toISOString().substring(0, 10);

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let prev: string | null = null;

    for (const date of dates) {
      if (prev === null) {
        const diff =
          (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000;
        if (diff > 1) {
          streak = 1;
        } else {
          streak = 1;
          currentStreak = 1;
        }
      } else {
        const daysBetween =
          (new Date(prev).getTime() - new Date(date).getTime()) / 86_400_000;
        if (daysBetween === 1) {
          streak += 1;
          if (currentStreak > 0) currentStreak = streak;
        } else {
          if (streak > longestStreak) longestStreak = streak;
          streak = 1;
          if (currentStreak > 0) currentStreak = 0;
        }
      }
      if (streak > longestStreak) longestStreak = streak;
      prev = date;
    }

    return {
      currentStreak,
      longestStreak,
      lastCheckIn: records[0]?.checkInAt ?? null,
    };
  }
}
