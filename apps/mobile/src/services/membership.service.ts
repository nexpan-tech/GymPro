import { api } from "../api/client";

export interface Membership {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const membershipService = {
  getMyMembership: async (): Promise<Membership | null> => {
    const res = await api.get("/memberships/my");
    return unwrap<Membership | null>(res);
  },
};