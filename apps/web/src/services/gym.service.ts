import api from "@/lib/axios";

export const gymService = {
  getGym: async () => {
    const res = await api.get("/gym");
    return res.data;
  },

  updateGym: async (data: any) => {
    const res = await api.put("/gym", data);
    return res.data;
  },

  getStats: async () => {
    const res = await api.get("/gym/stats");
    return res.data;
  },
};