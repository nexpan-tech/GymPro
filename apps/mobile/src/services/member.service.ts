import { api } from "../lib/api";
import type { Member } from "../types/member.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const memberService = {
  getMyProfile: async (): Promise<Member | null> => {
    const res = await api.get("/members");
    const members = unwrap<Member[]>(res);
    return Array.isArray(members) ? members[0] ?? null : null;
  },
};