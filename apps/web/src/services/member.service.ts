import api from "@/lib/axios";
import type { Member } from "@/types/member.types";

export const memberService = {
  getAll: async (): Promise<Member[]> => {
    const res = await api.get("/members");
    return res.data;
  },

  getById: async (id: string): Promise<Member> => {
    const res = await api.get(`/members/${id}`);
    return res.data;
  },

  create: async (data: Partial<Member>): Promise<Member> => {
    const res = await api.post("/members", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Member>): Promise<Member> => {
    const res = await api.put(`/members/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/members/${id}`);
  },
};