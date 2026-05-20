import api from "@/lib/axios";
import type { Membership } from "@/types/membership.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const membershipService = {
  getAll: async (): Promise<Membership[]> => {
    const res = await api.get("/memberships");
    return unwrap<Membership[]>(res);
  },

  getMyActive: async (): Promise<Membership | null> => {
    const res = await api.get("/memberships");
    const memberships = unwrap<Membership[]>(res);
    return Array.isArray(memberships) ? memberships[0] ?? null : null;
  },

  create: async (data: Partial<Membership>): Promise<Membership> => {
    const res = await api.post("/memberships", data);
    return unwrap<Membership>(res);
  },

  update: async (id: string, data: Partial<Membership>): Promise<Membership> => {
    const res = await api.put(`/memberships/${id}`, data);
    return unwrap<Membership>(res);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/memberships/${id}`);
  },
};