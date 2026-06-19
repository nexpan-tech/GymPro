import { api } from "@/lib/api";

// ── Types ──
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
  member?: { user?: { name: string } };
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
  participants?: { id: string; memberId: string; progress: number; isCompleted: boolean; member?: { user?: { name: string } } }[];
}
export interface EngagementAnalytics {
  totalMembers: number;
  challengeParticipations: number;
  challengeParticipationRate: number;
  rewardRedemptions: number;
  rewardRedemptionRate: number;
  totalReferrals: number;
  referralConversionRate: number;
  avgXp: number;
  avgLevel: number;
  totalPointsAwarded: number;
}
export interface Referral {
  id: string;
  code: string;
  inviteeName?: string | null;
  inviteePhone?: string | null;
  status: string;
  rewardPoints: number;
  convertedAt?: string | null;
  createdAt: string;
  referrer?: { user?: { name: string } };
}

export interface TrainerMemberRow {
  memberId: string;
  name: string;
  points: number;
  level: number;
  attendanceStreak: number;
  workoutStreak: number;
  dietStreak: number;
  activeChallenges: number;
  needsMotivation: boolean;
}
export interface PlatformEngagement {
  totalGyms: number;
  totalChallengeParticipations: number;
  totalRedemptions: number;
  totalReferrals: number;
  referralConversionRate: number;
  totalPoints: number;
  avgLevel: number;
  topGyms: { gymId: string; name: string; participations: number; redemptions: number; referrals: number }[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const gamificationService = {
  // Member
  mySummary: async (memberId?: string): Promise<MemberSummary> =>
    unwrap<MemberSummary>(await api.get(`/gamification/me/summary${memberId ? `?memberId=${memberId}` : ""}`)),
  leaderboard: async (
    scope: "GYM" | "BRANCH" | "CHALLENGE" = "GYM",
    refId?: string,
    period: "ALL" | "MONTH" = "ALL",
  ): Promise<LeaderboardRow[]> =>
    unwrap<LeaderboardRow[]>(
      await api.get(`/gamification/leaderboard?scope=${scope}&period=${period}${refId ? `&refId=${refId}` : ""}`),
    ) ?? [],
  analytics: async (): Promise<EngagementAnalytics> =>
    unwrap<EngagementAnalytics>(await api.get("/gamification/analytics")),
  trainerMembers: async (): Promise<TrainerMemberRow[]> =>
    unwrap<TrainerMemberRow[]>(await api.get("/gamification/trainer/members")) ?? [],
  platform: async (): Promise<PlatformEngagement> =>
    unwrap<PlatformEngagement>(await api.get("/gamification/platform")),

  // Rewards
  rewards: async (all = false): Promise<Reward[]> =>
    unwrap<Reward[]>(await api.get(`/gamification/rewards${all ? "?all=true" : ""}`)) ?? [],
  createReward: async (data: Partial<Reward>): Promise<Reward> => unwrap<Reward>(await api.post("/gamification/rewards", data)),
  updateReward: async (id: string, data: Partial<Reward>): Promise<Reward> => unwrap<Reward>(await api.patch(`/gamification/rewards/${id}`, data)),
  deleteReward: async (id: string): Promise<{ softDeleted?: boolean; deleted?: boolean }> =>
    unwrap(await api.delete(`/gamification/rewards/${id}`)),
  redeem: async (rewardId: string): Promise<unknown> => unwrap<unknown>(await api.post(`/gamification/rewards/${rewardId}/redeem`, {})),
  redemptions: async (): Promise<Redemption[]> => unwrap<Redemption[]>(await api.get("/gamification/redemptions")) ?? [],
  myRedemptions: async (): Promise<Redemption[]> => unwrap<Redemption[]>(await api.get("/gamification/me/redemptions")) ?? [],
  updateRedemption: async (id: string, status: string): Promise<unknown> =>
    unwrap<unknown>(await api.patch(`/gamification/redemptions/${id}`, { status })),
};

export const challengeService = {
  list: async (): Promise<Challenge[]> => unwrap<Challenge[]>(await api.get("/community/challenges")) ?? [],
  create: async (data: Partial<Challenge>): Promise<Challenge> => unwrap<Challenge>(await api.post("/community/challenges", data)),
  join: async (id: string, memberId: string): Promise<unknown> => unwrap<unknown>(await api.post(`/community/challenges/${id}/join`, { memberId })),
  progress: async (id: string, memberId: string, progress: number): Promise<unknown> =>
    unwrap<unknown>(await api.patch(`/community/challenges/${id}/progress`, { memberId, progress })),
  leaderboard: async (id: string): Promise<LeaderboardRow[]> =>
    unwrap<LeaderboardRow[]>(await api.get(`/community/challenges/${id}/leaderboard`)) ?? [],
};

export const referralService = {
  myCode: async (): Promise<{ code: string; shareText: string; total: number; converted: number; rewardPerConversion: number }> =>
    unwrap(await api.get("/referrals/me/code")),
  myReferrals: async (): Promise<Referral[]> => unwrap<Referral[]>(await api.get("/referrals/me")) ?? [],
  createInvite: async (data: { inviteeName?: string; inviteePhone?: string; inviteeEmail?: string }): Promise<Referral> =>
    unwrap<Referral>(await api.post("/referrals", data)),
  listForGym: async (): Promise<{ referrals: Referral[]; stats: { total: number; converted: number; pending: number; conversionRate: number; rewardsIssued: number } }> =>
    unwrap(await api.get("/referrals")),
  convert: async (id: string): Promise<unknown> => unwrap<unknown>(await api.post(`/referrals/${id}/convert`, {})),
};
