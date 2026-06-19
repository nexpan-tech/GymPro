import { api } from "@/lib/api";

/** Unwrap the `{ success, data }` envelope. */
function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlatformDashboard {
  kpis: {
    totalGyms: number; activeGyms: number; inactiveGyms: number;
    totalBranches: number; totalMembers: number; activeMembers: number;
    totalTrainers: number; totalGymAdmins: number;
    mrr: number; arr: number; paidSaaS: number; pendingSaaS: number; overdueSaaS: number;
    monthlyRevenue: number;
  };
  gymTrend: { month: string; count: number }[];
  memberTrend: { month: string; count: number }[];
  revenueTrend: { month: string; revenue: number }[];
  topGymsByActiveMembers: { gymId: string; name: string; activeMembers: number }[];
  topGymsBySaaSRevenue: { gymId: string; name: string; revenue: number }[];
  recentGyms: { gymId: string; name: string; isActive: boolean; activeMembers: number; monthlyAmount: number; createdAt: string }[];
  recentBilling: { id: string; gymName: string; invoiceNumber: string; billingMonth: string | null; totalAmount: number; status: string; createdAt: string }[];
}

export interface PlatformGymRow {
  id: string; name: string; email: string; isActive: boolean; subscriptionStatus: string;
  branchCount: number; activeMemberCount: number; totalMemberCount: number;
  trainerCount: number; gymAdminCount: number;
  pricePerActiveMember: number; gstPercent: number; monthlyAmount: number; createdAt: string;
}

export interface SubscriptionRow {
  gymId: string; gymName: string; ownerEmail: string; subscriptionStatus: string;
  activeMemberCount: number; pricePerActiveMember: number; gstPercent: number;
  subtotal: number; gstAmount: number; monthlyAmount: number;
  currentBillingMonth: string; billingStatus: string;
  lastBilledDate: string | null; lastPaidDate: string | null; pendingAmount: number;
  latestInvoice: { id: string; invoiceNumber: string; billingMonth: string | null; status: string; totalAmount: number; dueDate: string; sentAt: string | null; paidAt: string | null } | null;
}

export interface SaaSInvoiceRow {
  id: string; gymId: string; invoiceNumber: string; billingMonth: string | null;
  activeMemberCount: number | null; pricePerMember: number | null;
  amount: number; gstPercent: number | null; gstAmount: number; totalAmount: number;
  status: string; effectiveStatus: string; dueDate: string; paidAt: string | null;
  emailStatus: string | null; sentAt: string | null; createdAt: string;
  gym?: { id: string; name: string; gstNumber: string | null };
}

export interface PlatformMetrics {
  api: { status: string; uptimeSeconds: number; nodeVersion: string; env: string };
  database: { status: string };
  redis: { status: string };
  queue: { status: string; queues: { name: string; waiting: number; active: number; completed: number; failed: number; delayed: number }[] };
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  platform: { activeGyms: number; activeUsers: number };
  timestamp: string;
}

export interface PlatformBillingSettings {
  id: string;
  companyName: string; companyLogo: string | null; companyAddress: string | null;
  companyEmail: string | null; companyPhone: string | null; companyWebsite: string | null;
  gstNumber: string | null; defaultGstPercent: number; panNumber: string | null; cinNumber: string | null;
  accountName: string | null; accountNumber: string | null; bankName: string | null; ifscCode: string | null; upiId: string | null;
  invoicePrefix: string; invoiceFooter: string | null; paymentTerms: string | null; dueDays: number;
}

export interface FeatureFlagRow {
  id: string; key: string; label: string; description: string | null; category: string | null;
  defaultEnabled: boolean; rolloutPercentage: number | null; environment: string | null; isActive: boolean;
  overrides: number; enabledOverrides: number; disabledOverrides: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const superAdminService = {
  getDashboard: async (): Promise<PlatformDashboard> => unwrap(await api.get("/super-admin/dashboard")),
  getGyms: async (): Promise<PlatformGymRow[]> => unwrap(await api.get("/super-admin/gyms")) ?? [],

  // SaaS billing
  getSubscriptions: async (): Promise<SubscriptionRow[]> => unwrap(await api.get("/super-admin/subscriptions")) ?? [],
  getBillingSummary: async (): Promise<{ mrr: number; arr: number; paid: number; pending: number; overdue: number }> =>
    unwrap(await api.get("/super-admin/billing/summary")),
  generateInvoices: async (month?: string): Promise<{ billingMonth: string; created: number; skipped: number; totalBilled: number }> =>
    unwrap(await api.post("/super-admin/billing/generate", month ? { month } : {})),
  listInvoices: async (params?: { month?: string; status?: string; gymId?: string }): Promise<SaaSInvoiceRow[]> =>
    unwrap(await api.get("/super-admin/billing/invoices", { params })) ?? [],
  getInvoice: async (id: string): Promise<SaaSInvoiceRow> => unwrap(await api.get(`/super-admin/billing/invoices/${id}`)),
  recordPayment: async (id: string): Promise<SaaSInvoiceRow> => unwrap(await api.post(`/super-admin/billing/invoices/${id}/pay`, {})),
  cancelInvoice: async (id: string): Promise<SaaSInvoiceRow> => unwrap(await api.post(`/super-admin/billing/invoices/${id}/cancel`, {})),
  downloadInvoicePdf: async (id: string, invoiceNumber: string): Promise<void> => {
    const res = await api.get(`/super-admin/billing/invoices/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${invoiceNumber}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },

  // Platform billing settings (Nexpan Tech identity)
  getSettings: async (): Promise<PlatformBillingSettings> => unwrap(await api.get("/super-admin/settings")),
  updateSettings: async (payload: Partial<PlatformBillingSettings>): Promise<PlatformBillingSettings> =>
    unwrap(await api.put("/super-admin/settings", payload)),

  // Operations
  getMetrics: async (): Promise<PlatformMetrics> => unwrap(await api.get("/super-admin/metrics")),
  getMonitoring: async (): Promise<any> => unwrap(await api.get("/super-admin/monitoring")),
  getQueue: async (): Promise<{ available: boolean; reason?: string; queues: any[] }> => unwrap(await api.get("/super-admin/queue")),

  // Feature flags (CRUD)
  listFlags: async (): Promise<FeatureFlagRow[]> => unwrap(await api.get("/feature-flags/admin")) ?? [],
  createFlag: async (payload: Partial<FeatureFlagRow> & { key: string; label: string }): Promise<FeatureFlagRow> =>
    unwrap(await api.post("/feature-flags/admin", payload)),
  updateFlag: async (key: string, payload: Partial<FeatureFlagRow>): Promise<FeatureFlagRow> =>
    unwrap(await api.put(`/feature-flags/admin/${key}`, payload)),
  deleteFlag: async (key: string): Promise<FeatureFlagRow> => unwrap(await api.delete(`/feature-flags/admin/${key}`)),
};
