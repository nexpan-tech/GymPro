import { api } from "../api/client";

export interface MembershipPlanRef {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

export interface Membership {
  id: string;
  planId?: string | null;
  plan?: string | null;
  planRef?: MembershipPlanRef | null;
  startDate?: string;
  endDate?: string;
  amount?: number;
  paymentStatus?: string;
  status?: string;
  effectiveStatus?: string;
  daysRemaining?: number;
  freezeStartDate?: string | null;
  freezeEndDate?: string | null;
}

export interface MyMembership {
  current: Membership | null;
  history: Membership[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const membershipService = {
  /** Current membership + full history for the logged-in member. */
  getMy: async (): Promise<MyMembership> => {
    const res = await api.get("/memberships/my");
    const data = unwrap<MyMembership>(res);
    return {
      current: data?.current ?? null,
      history: Array.isArray(data?.history) ? data.history : [],
    };
  },

  /** Backwards-compatible: just the current membership. */
  getMyMembership: async (): Promise<Membership | null> => {
    const { current } = await membershipService.getMy();
    return current;
  },
};
