import api from "@/lib/axios";
import type { Membership } from "@/types/membership.types";

export const membershipService = {
  getAll: async (): Promise<Membership[]> => {
    const res = await api.get("/memberships");
    return res.data;
  },

  create: async (data: Partial<Membership>): Promise<Membership> => {
    const res = await api.post("/memberships", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Membership>): Promise<Membership> => {
    const res = await api.put(`/memberships/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/memberships/${id}`);
  },
};