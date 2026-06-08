import { api } from "@/lib/api";

export const experienceService = {
  getDashboard: async (memberId: string) => {
    const res = await api.get(`/experience/dashboard/${memberId}`);
    return res.data.data;
  },

  getRecommendations: async (memberId: string) => {
    const res = await api.get(`/experience/recommendations/${memberId}`);
    return res.data.data;
  },
};