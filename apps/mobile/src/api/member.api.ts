import { api } from "./client";
import type { MemberProfile, MembershipInfo } from "../types/member.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string | null;
  exercises?: unknown[];
}

export interface DietPlan {
  id: string;
  name: string;
  description?: string | null;
  meals?: unknown[];
}

export interface XPInfo {
  total: number;
  level: number;
  nextLevelXP?: number | null;
}

export interface Badge {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  earnedAt: string;
}

export interface Goal {
  id: string;
  memberId: string;
  title: string;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate?: string | null;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  currency?: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  method?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export const memberApi = {
  getMyProfile: async (): Promise<MemberProfile> => {
    const res = await api.get("/auth/me");
    return unwrap<MemberProfile>(res);
  },

  getActiveMembership: async (): Promise<MembershipInfo | null> => {
    // Member-accessible endpoint; returns { current, history }.
    const res = await api.get("/memberships/my");
    const data = unwrap<{ current: MembershipInfo | null } | MembershipInfo[]>(res);
    if (Array.isArray(data)) return data[0] ?? null;
    return data?.current ?? null;
  },

  getMyWorkoutPlan: async (): Promise<WorkoutPlan | null> => {
    const res = await api.get("/workouts/my");
    return unwrap<WorkoutPlan | null>(res);
  },

  getMyDietPlan: async (): Promise<DietPlan | null> => {
    const res = await api.get("/diets/my");
    return unwrap<DietPlan | null>(res);
  },

  getMyXP: async (): Promise<XPInfo> => {
    const res = await api.get("/gamification/xp");
    return unwrap<XPInfo>(res);
  },

  getMyBadges: async (): Promise<Badge[]> => {
    const res = await api.get("/badges/me");
    return unwrap<Badge[]>(res);
  },

  getMyGoals: async (): Promise<Goal[]> => {
    const res = await api.get("/goals");
    return unwrap<Goal[]>(res);
  },

  getMyPayments: async (): Promise<Payment[]> => {
    // Member self-service history; the gym-wide /payments list is staff-only.
    const res = await api.get("/payments/my");
    return unwrap<Payment[]>(res);
  },
};
