import { api } from "../api/client";
import type { Member } from "../types/member.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export interface PeriodStreak {
  attended: number;
  operationalDays: number;
  consistency: number;
  streak: number;
}

export interface MemberStreak {
  current: number;
  best: number;
  thisMonth: PeriodStreak;
  thisYear: PeriodStreak;
  lastAttendedDate: string | null;
  totalDaysAttended: number;
  closedWeekdays: number[];
}

export const memberService = {
  getMyProfile: async (): Promise<Member | null> => {
    // Members can only read their own record via /members/me — the gym-wide
    // /members list is staff-only (was returning 403).
    const res = await api.get("/members/me");
    return unwrap<Member | null>(res);
  },

  // Phase 3 — attendance streak summary (operational-day engine; Sundays
  // excluded). Single source of truth shared with web.
  getStreak: async (): Promise<MemberStreak> => {
    const res = await api.get("/members/streak");
    return unwrap<MemberStreak>(res);
  },
};