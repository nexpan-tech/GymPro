import api from "@/lib/axios";

export const notificationService = {
  getAll: async () => {
    const res = await api.get("/notifications");
    return res.data.data;
  },
  markRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}`);
    return res.data;
  },
  create: async (data: {
    title: string;
    message: string;
    audience: string;
  }) => {
    const res = await api.post("/notifications", data);
    return res.data.data || res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};