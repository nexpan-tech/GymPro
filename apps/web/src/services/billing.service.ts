import { api } from "@/lib/api";

// SaaS billing (GymPro → Gyms). Super-admin analytics + gym subscription views.

export interface SaaSOverview {
  mrr: number;
  arr: number;
  activeGyms: number;
  trialGyms: number;
  churnRate: number;
  cancelledLast30: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface SaaSPlan {
  id: string;
  name: string;
  description?: string | null;
  interval: "MONTHLY" | "YEARLY";
  price: number;
  maxBranches?: number | null;
  maxMembers?: number | null;
  maxStaff?: number | null;
  isActive: boolean;
}

export interface SaaSInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface GymSubscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: SaaSPlan;
  invoices?: SaaSInvoice[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const billingService = {
  // ── Super-admin platform analytics ──
  adminOverview: async (): Promise<SaaSOverview> =>
    unwrap<SaaSOverview>(await api.get("/admin/billing/overview")),
  adminRevenueTrend: async (months = 6): Promise<RevenuePoint[]> =>
    unwrap<RevenuePoint[]>(await api.get(`/admin/billing/revenue-trend?months=${months}`)) ?? [],

  // ── Plans + gym subscription ──
  getPlans: async (): Promise<SaaSPlan[]> =>
    unwrap<SaaSPlan[]>(await api.get("/billing/plans")) ?? [],
  getMySubscription: async (): Promise<GymSubscription | null> =>
    unwrap<GymSubscription | null>(await api.get("/billing/subscription")),
  getSubscriptionInvoices: async (): Promise<SaaSInvoice[]> =>
    unwrap<SaaSInvoice[]>(await api.get("/billing/invoices")) ?? [],
};
