import { api } from "../api/client";
import type { Attendance } from "../types/attendance.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const attendanceService = {
  getMyAttendance: async (): Promise<Attendance[]> => {
    const res = await api.get("/attendance/my");
    return unwrap<Attendance[]>(res);
  },

  scanQr: async (payload: { gymId: string }): Promise<Attendance> => {
    const res = await api.post("/attendance/scan", payload);
    return unwrap<Attendance>(res);
  },

  scan: async (gymId: string): Promise<Attendance> => {
    const res = await api.post("/attendance/scan", { gymId });
    return unwrap<Attendance>(res);
  },
};