import { api } from "@/lib/api";

export interface EnterpriseOverview {
  revenue: { mrr: number; arr: number; churnRate: number; revenueTrend: { month: string; revenue: number }[] };
  members: { activeGyms: number; trialGyms: number; totalGyms: number; totalMembers: number; activeMembers: number };
  retention: { retentionRate: number; churnRate: number; atRiskMembers: number; leadConversionRate: number; trialConversionRate: number };
  engagement: { challengeParticipations: number; rewardRedemptions: number; referrals: number; referralConversionRate: number; avgLevel: number; totalPoints: number };
  communication: { messagesSent: number; messagesFailed: number; announcementsSent: number };
  topGyms: { gymId: string; name: string; members: number; atRisk: number; leadConversionRate: number }[];
}

export interface Forecast {
  metric: string; unit: string; current: number; projected: number; changePercent: number; direction: "up" | "down" | "flat"; confidence: number;
}
export interface Insight {
  type: string; title: string; description: string; severity: "info" | "positive" | "warning"; confidence: number; metric?: number;
}
export interface Recommendation { title: string; description: string; confidence: number; category: string }

export interface FeatureFlag { key: string; label: string; category: string; description?: string; enabled: boolean; overridden?: boolean }

export interface WhiteLabel {
  appName?: string; logoUrl?: string; faviconUrl?: string;
  primaryColor?: string; secondaryColor?: string; accentColor?: string;
  emailFromName?: string; emailLogoUrl?: string; emailFooterText?: string; supportEmail?: string;
  mobileAppName?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const enterpriseService = {
  overview: async (): Promise<EnterpriseOverview> => unwrap<EnterpriseOverview>(await api.get("/admin/enterprise/overview")),
};

export const aiService = {
  forecast: async (): Promise<Forecast[]> => unwrap<Forecast[]>(await api.get("/ai/forecast")) ?? [],
  insights: async (): Promise<Insight[]> => unwrap<Insight[]>(await api.get("/ai/insights")) ?? [],
  myRecommendations: async (): Promise<Recommendation[]> => unwrap<Recommendation[]>(await api.get("/ai/me/recommendations")) ?? [],
};

export const featureFlagService = {
  catalogue: async (): Promise<{ key: string; label: string; category: string; description?: string; defaultEnabled: boolean }[]> =>
    unwrap(await api.get("/feature-flags/catalogue")) ?? [],
  forGym: async (gymId: string): Promise<FeatureFlag[]> => unwrap<FeatureFlag[]>(await api.get(`/feature-flags/gym/${gymId}`)) ?? [],
  setForGym: async (gymId: string, flagKey: string, enabled: boolean): Promise<unknown> =>
    unwrap(await api.put(`/feature-flags/gym/${gymId}`, { flagKey, enabled })),
  seed: async (): Promise<unknown> => unwrap(await api.post("/feature-flags/seed", {})),
};

export const whiteLabelService = {
  get: async (): Promise<WhiteLabel | null> => unwrap<WhiteLabel | null>(await api.get("/white-label/settings")),
  upsert: async (data: WhiteLabel): Promise<WhiteLabel> => unwrap<WhiteLabel>(await api.put("/white-label/settings", data)),
};
