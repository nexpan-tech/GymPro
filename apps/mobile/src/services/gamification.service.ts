import { api } from "../api/client";

export interface StreakRow {
  type: "ATTENDANCE" | "WORKOUT" | "DIET";
  current: number;
  longest: number;
  lastActivityDate: string | null;
}
export interface MemberSummary {
  memberId: string;
  lifetimePoints: number;
  level: number;
  balance: number;
  streak: number;
  streaks: StreakRow[];
  badgeCount: number;
}
export interface LeaderboardRow {
  rank: number;
  memberId: string;
  name: string;
  xp?: number;
  level?: number;
  streak?: number;
  progress?: number;
  isCompleted?: boolean;
}
export interface Reward {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  pointsCost: number;
  xpCost?: number | null;
  stock?: number | null;
  isActive: boolean;
}
export interface Redemption {
  id: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  reward?: Reward;
}
export interface Challenge {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  targetValue?: number | null;
  startDate: string;
  endDate: string;
  participants?: { memberId: string; progress: number; isCompleted: boolean }[];
}
export interface EarnedBadge {
  id: string;
  earnedAt: string;
  badge: { name: string; description?: string | null; type: string; icon?: string | null };
}
export interface ReferralInfo {
  code: string;
  shareText: string;
  total: number;
  converted: number;
  rewardPerConversion: number;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const gamificationService = {
  mySummary: async (): Promise<MemberSummary> => unwrap<MemberSummary>(await api.get("/gamification/me/summary")),
  leaderboard: async (): Promise<LeaderboardRow[]> => unwrap<LeaderboardRow[]>(await api.get("/gamification/leaderboard?scope=GYM")) ?? [],
  rewards: async (): Promise<Reward[]> => unwrap<Reward[]>(await api.get("/gamification/rewards")) ?? [],
  redeem: async (rewardId: string): Promise<unknown> => unwrap<unknown>(await api.post(`/gamification/rewards/${rewardId}/redeem`, {})),
  myRedemptions: async (): Promise<Redemption[]> => unwrap<Redemption[]>(await api.get("/gamification/me/redemptions")) ?? [],
  myBadges: async (): Promise<EarnedBadge[]> => unwrap<EarnedBadge[]>(await api.get("/badges/me")) ?? [],
  challenges: async (): Promise<Challenge[]> => unwrap<Challenge[]>(await api.get("/community/challenges")) ?? [],
  joinChallenge: async (id: string, memberId: string): Promise<unknown> =>
    unwrap<unknown>(await api.post(`/community/challenges/${id}/join`, { memberId })),
  challengeLeaderboard: async (id: string): Promise<LeaderboardRow[]> =>
    unwrap<LeaderboardRow[]>(await api.get(`/community/challenges/${id}/leaderboard`)) ?? [],
  myReferralCode: async (): Promise<ReferralInfo> => unwrap<ReferralInfo>(await api.get("/referrals/me/code")),
};
