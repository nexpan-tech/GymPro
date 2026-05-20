import api from "@/lib/axios";
import type { Attendance } from "@/types/attendance.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const attendanceService = {
  getMyAttendance: async (): Promise<Attendance[]> => {
    const res = await api.get("/attendance/my");
    return unwrap<Attendance[]>(res);
  },

  scanQr: async (gymId: string): Promise<Attendance> => {
    const res = await api.post("/attendance/scan", { gymId });
    return unwrap<Attendance>(res);
  },

  getMemberAttendance: async (memberId: string): Promise<Attendance[]> => {
    const res = await api.get(`/attendance/member/${memberId}`);
    return unwrap<Attendance[]>(res);
  },

  getDaily: async (date?: string): Promise<Attendance[]> => {
    const res = await api.get("/attendance/daily", {
      params: date ? { date } : undefined,
    });
    return unwrap<Attendance[]>(res);
  },
};