import api from "@/lib/axios";

export const dietService = {
  getAll: async () => {
    const res = await api.get("/diets");
    return res.data.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post("/diets", data);
    return res.data;
  },
};