import api from "@/lib/axios";
import type { Member } from "@/types/member.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const memberService = {
  getAll: async (): Promise<Member[]> => {
    const res = await api.get("/members");
    return unwrap<Member[]>(res);
  },

  getMyProfile: async (): Promise<Member | null> => {
    const res = await api.get("/members");
    const members = unwrap<Member[]>(res);
    return Array.isArray(members) ? members[0] ?? null : null;
  },

  getById: async (id: string): Promise<Member> => {
    const res = await api.get(`/members/${id}`);
    return unwrap<Member>(res);
  },

  create: async (data: Partial<Member>): Promise<Member> => {
    const res = await api.post("/members", data);
    return unwrap<Member>(res);
  },

  update: async (id: string, data: Partial<Member>): Promise<Member> => {
    const res = await api.put(`/members/${id}`, data);
    return unwrap<Member>(res);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/members/${id}`);
  },
};