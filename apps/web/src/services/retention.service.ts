import { api } from "@/lib/api";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RetentionOverview {
  totalMembers: number;
  atRiskMembers: number;
  riskBreakdown: Record<RiskLevel, number>;
  retentionRate: number;
  churnRate: number;
  avgRetentionScore: number;
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  totalTrials: number;
  convertedTrials: number;
  trialConversionRate: number;
}

export interface MemberRisk {
  memberId: string;
  name: string;
  email?: string | null;
  trainerId?: string | null;
  retentionScore: number | null;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  scoredAt: string | null;
}

export interface ChurnRow {
  memberId: string;
  name: string;
  retentionScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  daysInactive: number | null;
  membershipExpired: boolean;
  pendingDue: number;
  renewalProbability: number;
}

export interface Prediction {
  predictionScore: number;
  confidence: number;
  riskLevel: string;
  factors: string[];
  model: string;
}
export interface PredictionRow {
  memberId: string;
  name: string;
  churn: Prediction;
  renewal: Prediction;
}

export interface PlatformRetention {
  totalGyms: number;
  totalMembers: number;
  atRiskMembers: number;
  retentionRate: number;
  churnRate: number;
  totalLeads: number;
  leadConversionRate: number;
  totalTrials: number;
  trialConversionRate: number;
  perGym: { gymId: string; name: string; members: number; atRisk: number; leads: number; leadConversionRate: number }[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const retentionService = {
  overview: async (): Promise<RetentionOverview> =>
    unwrap<RetentionOverview>(await api.get("/retention/overview")),
  members: async (level?: RiskLevel): Promise<MemberRisk[]> =>
    unwrap<MemberRisk[]>(await api.get(`/retention/members${level ? `?level=${level}` : ""}`)) ?? [],
  churn: async (): Promise<ChurnRow[]> =>
    unwrap<ChurnRow[]>(await api.get("/retention/churn")) ?? [],
  predictions: async (): Promise<PredictionRow[]> =>
    unwrap<PredictionRow[]>(await api.get("/retention/predictions")) ?? [],
  trainerMy: async (): Promise<MemberRisk[]> =>
    unwrap<MemberRisk[]>(await api.get("/retention/trainer/my")) ?? [],
  platform: async (): Promise<PlatformRetention> =>
    unwrap<PlatformRetention>(await api.get("/retention/platform")),
  recompute: async (): Promise<{ updated: number }> =>
    unwrap<{ updated: number }>(await api.post("/retention/recompute", {})),
};
