import { api } from "@/lib/api";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "TRIAL"
  | "TRIAL_BOOKED"
  | "TRIAL_COMPLETED"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST";

export type LeadSource =
  | "WALK_IN"
  | "WEBSITE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "REFERRAL"
  | "CALL"
  | "OTHER";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: LeadSource;
  status: LeadStatus;
  fitnessGoal?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  trialDate?: string | null;
  convertedAt?: string | null;
  leadScore: number;
  assignedTo?: { id: string; name: string } | null;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  note?: string | null;
  fromStatus?: LeadStatus | null;
  toStatus?: LeadStatus | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface LeadFunnel {
  totalLeads: number;
  conversionRate: number;
  lossRate: number;
  funnel: Record<LeadStatus, number>;
}

export interface Trial {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "CONVERTED" | "CANCELLED";
  startDate: string;
  endDate: string;
  convertedAt?: string | null;
  lead?: { id: string; name: string } | null;
  member?: { id: string; user?: { name: string } } | null;
}

export interface TrialStats {
  total: number;
  active: number;
  converted: number;
  expired: number;
  cancelled: number;
  conversionRate: number;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const crmService = {
  // Leads
  listLeads: async (): Promise<Lead[]> => unwrap<Lead[]>(await api.get("/leads")) ?? [],
  createLead: async (data: Partial<Lead>): Promise<Lead> => unwrap<Lead>(await api.post("/leads", data)),
  funnel: async (): Promise<LeadFunnel> => unwrap<LeadFunnel>(await api.get("/leads/analytics/funnel")),
  changeStatus: async (id: string, status: LeadStatus): Promise<Lead> =>
    unwrap<Lead>(await api.patch(`/leads/${id}/status`, { status })),
  activities: async (id: string): Promise<LeadActivity[]> =>
    unwrap<LeadActivity[]>(await api.get(`/leads/${id}/activities`)) ?? [],
  addActivity: async (id: string, data: { type?: string; note?: string; followUpDate?: string }): Promise<LeadActivity> =>
    unwrap<LeadActivity>(await api.post(`/leads/${id}/activities`, data)),

  // Trials
  listTrials: async (): Promise<Trial[]> => unwrap<Trial[]>(await api.get("/trials")) ?? [],
  trialStats: async (): Promise<TrialStats> => unwrap<TrialStats>(await api.get("/trials/stats")),
  createTrial: async (data: { leadId?: string; memberId?: string; planId?: string; days?: number }): Promise<Trial> =>
    unwrap<Trial>(await api.post("/trials", data)),
  convertTrial: async (id: string, data: { planId?: string; amount?: number } = {}): Promise<unknown> =>
    unwrap<unknown>(await api.post(`/trials/${id}/convert`, data)),
};

export const automationService = {
  run: async (
    job:
      | "renewals"
      | "dues"
      | "renewal-campaigns"
      | "inactive-members"
      | "retention-alerts"
      | "engagement-reminders"
      | "score-recompute"
      | "churn-risk"
      | "trial-conversion",
  ): Promise<unknown> => unwrap<unknown>(await api.post(`/automation/${job}`, {})),
};
