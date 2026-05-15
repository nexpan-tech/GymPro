import api from "@/lib/axios";
import type { Trainer } from "@/types/user.types";

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    const res = await api.get("/trainers");
    return res.data;
  },

  create: async (data: Partial<Trainer>): Promise<Trainer> => {
    const res = await api.post("/trainers", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Trainer>): Promise<Trainer> => {
    const res = await api.put(`/trainers/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/trainers/${id}`);
  },
};