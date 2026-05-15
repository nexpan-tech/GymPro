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
};