import api from "@/lib/axios";
import type { Attendance } from "@/types/attendance.types";

export const attendanceService = {
  getAll: async (): Promise<Attendance[]> => {
    const res = await api.get("/attendance");
    return res.data;
  },

  mark: async (data: Partial<Attendance>): Promise<Attendance> => {
    const res = await api.post("/attendance", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/attendance/${id}`);
  },
};