import { api } from "@/lib/api";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Interval = "MONTHLY" | "YEARLY";
export type LicenseTier = "HEALTHY" | "APPROACHING_CAPACITY" | "UPGRADE_RECOMMENDED" | "FULL";

export interface DimensionUsage { used: number; capacity: number | null; remaining: number | null; utilizationPct: number; tier?: LicenseTier }

export interface PlanComparisonRow { id: string; name: string; price: number; interval: Interval; isActive: boolean; maxMembers: number | null; maxBranches: number | null; maxStaff: number | null }

export interface LicensePlan {
  id: string;
  name: string;
  description?: string | null;
  interval: Interval;
  price: number;
  maxMembers?: number | null;
  maxBranches?: number | null;
  maxStaff?: number | null;
  isActive: boolean;
}

export interface GymLicenseRow {
  gymId: string;
  gymName: string;
  ownerEmail?: string | null;
  licenseName: string | null;
  capacity: number | null;
  monthlyPrice: number;
  interval: Interval | null;
  licenseStatus: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  renewalDate: string | null;
  autoRenew: boolean | null;
  activeMembers: number;
  remaining: number | null;
  utilizationPct: number;
  tier: LicenseTier;
  tierMessage: string;
  branchUsage?: DimensionUsage;
  staffUsage?: DimensionUsage;
  billingStatus: string;
  lastInvoiceDate: string | null;
  lastPaidDate: string | null;
  nextInvoiceTotal: number;
}

export interface GymLicenseDetail {
  gymId: string;
  gymName: string;
  ownerEmail?: string | null;
  license: {
    subscriptionId: string;
    planId: string;
    name: string;
    capacity: number | null;
    monthlyPrice: number;
    interval: Interval;
    gstPercent: number;
    gstEnabled: boolean;
    status: string;
    autoRenew: boolean;
    startDate: string;
    renewalDate: string;
    isTrial: boolean;
    trialEndsAt: string | null;
    trialExpired: boolean;
    invoicePrefix: string;
  } | null;
  usage: {
    activeMembers: number;
    capacity: number | null;
    remaining: number | null;
    utilizationPct: number;
    tier: LicenseTier;
    tierMessage: string;
    branches?: DimensionUsage;
    staff?: DimensionUsage;
  };
  billing: {
    billingStatus: string;
    lastInvoice: { id: string; invoiceNumber: string; billingMonth: string | null; totalAmount: number; status: string; dueDate: string; paidAt: string | null } | null;
    lastPaidDate: string | null;
    pendingAmount: number;
    nextInvoiceTotal: number;
  };
  invoices: Array<{ id: string; invoiceNumber: string; billingMonth: string | null; totalAmount: number; amount: number; gstAmount: number; status: string; effectiveStatus: string; dueDate: string; paidAt: string | null; createdAt: string }>;
}

export interface GenerateResult { billingMonth: string; created: number; skipped: number; totalBilled: number; invoices: unknown[] }

export interface UpcomingRenewal { gymId: string; gymName: string; planName: string; renewalDate: string; amount: number }
export interface LicenseBillingSummary {
  mrr: number; arr: number;
  activeLicenses: number; trialLicenses: number; pastDueLicenses: number;
  suspendedLicenses: number; expiredLicenses: number; cancelledLicenses: number;
  licensedGyms: number; unlicensedGyms: number;
  revenueThisMonth: number; paid: number; pending: number; overdue: number;
  upcomingRenewals: UpcomingRenewal[]; upcomingRenewalCount: number;
  planDistribution: { name: string; count: number }[];
  licenseDistribution: { status: string; count: number }[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const licenseService = {
  // Super-admin
  listLicenses: async (): Promise<GymLicenseRow[]> => unwrap(await api.get("/licenses")) ?? [],
  billingSummary: async (): Promise<LicenseBillingSummary> => unwrap(await api.get("/licenses/billing/summary")),
  getGymLicense: async (gymId: string): Promise<GymLicenseDetail> => unwrap(await api.get(`/licenses/gyms/${gymId}`)),
  getAudit: async (gymId: string): Promise<Record<string, unknown>> => unwrap(await api.get(`/licenses/gyms/${gymId}/audit`)),
  getHistory: async (gymId: string): Promise<unknown[]> => unwrap(await api.get(`/licenses/gyms/${gymId}/history`)) ?? [],

  listPlans: async (includeInactive = false): Promise<LicensePlan[]> =>
    unwrap(await api.get(`/licenses/plans${includeInactive ? "?includeInactive=true" : ""}`)) ?? [],
  comparison: async (): Promise<PlanComparisonRow[]> => unwrap(await api.get("/licenses/comparison")) ?? [],
  createPlan: async (data: Partial<LicensePlan>): Promise<LicensePlan> => unwrap(await api.post("/licenses/plans", data)),
  updatePlan: async (id: string, data: Partial<LicensePlan>): Promise<LicensePlan> => unwrap(await api.patch(`/licenses/plans/${id}`, data)),

  assignPlan: async (gymId: string, data: { planId: string; trialDays?: number; autoRenew?: boolean }): Promise<unknown> =>
    unwrap(await api.post(`/licenses/gyms/${gymId}/assign`, data)),
  suspend: async (gymId: string): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/suspend`, {})),
  resume: async (gymId: string): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/resume`, {})),
  cancel: async (gymId: string): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/cancel`, {})),
  renew: async (gymId: string): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/renew`, {})),
  convertTrial: async (gymId: string): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/convert-trial`, {})),
  extendTrial: async (gymId: string, days: number): Promise<unknown> => unwrap(await api.post(`/licenses/gyms/${gymId}/extend-trial`, { days })),
  runLifecycle: async (): Promise<{ processed: number; trialExpired: number; pastDue: number; suspended: number; trialEndingSoon: number; renewalDueSoon: number }> =>
    unwrap(await api.post("/licenses/lifecycle/run", {})),
  generate: async (month?: string): Promise<GenerateResult> => unwrap(await api.post("/licenses/generate", month ? { month } : {})),

  // Gym-admin (read-only self view)
  myLicense: async (): Promise<GymLicenseDetail> => unwrap(await api.get("/licenses/me")),
};
