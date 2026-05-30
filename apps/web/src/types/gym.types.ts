// ─── SaaS / Subscription ─────────────────────────────────────────────────────

export type SaaSPlanTier = "STARTER" | "GROWTH" | "PROFESSIONAL" | "ENTERPRISE";

export interface SaaSPlan {
  id: string;
  name: string;
  tier: SaaSPlanTier;
  /** Monthly price in paise / cents (smallest currency unit) */
  priceMonthly: number;
  maxBranches: number;
  maxMembers: number;
  maxTrainers: number;
  features: string[];
  isActive: boolean;
}

export interface GymSubscription {
  id: string;
  gymId: string;
  planId: string;
  plan?: SaaSPlan;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "PAUSED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Branch ───────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  gymId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  managerId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Gym ──────────────────────────────────────────────────────────────────────

export interface Gym {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  website?: string | null;
  timezone?: string | null;
  currency?: string | null;
  isActive: boolean;
  subscriptionId?: string | null;
  subscription?: GymSubscription | null;
  branches?: Branch[];
  createdAt: string;
  updatedAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  attendance: number;
  attendanceToday: number;
  activeSessions: number;
  totalTrainers: number;
  totalBranches: number;
  pendingDues: number;
}
