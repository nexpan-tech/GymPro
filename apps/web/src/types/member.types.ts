import type { User } from "./auth.types";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type MembershipPlan =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY"
  | "CUSTOM";

export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";

export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

// ─── Membership ───────────────────────────────────────────────────────────────

export interface Membership {
  id: string;
  gymId: string;
  branchId?: string | null;
  memberId: string;
  planName: string;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "paused" | "cancelled";
  price: number;
  autoRenew?: boolean;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

// ─── Due ──────────────────────────────────────────────────────────────────────

export interface Due {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  description?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  xpRequired?: number;
  gymId?: string | null;
  createdAt: string;
}

export interface MemberBadge {
  id: string;
  memberId: string;
  badgeId: string;
  badge?: Badge;
  awardedAt: string;
}

// ─── XP / Gamification ───────────────────────────────────────────────────────

export interface MemberXP {
  id: string;
  memberId: string;
  points: number;
  level: number;
  totalEarned: number;
  updatedAt: string;
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "TRIAL"
  | "CONVERTED"
  | "LOST";

export interface Lead {
  id: string;
  gymId: string;
  branchId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: LeadStatus;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  followUpDate?: string | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Member (Full Profile) ────────────────────────────────────────────────────

export interface Member {
  id: string;
  gymId: string;
  branchId?: string | null;
  userId: string;
  phone: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  fitnessGoal?: string | null;
  // Stage 2 health profile (matches backend column names)
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  healthNotes?: string | null;
  injuryNotes?: string | null;
  medicalConditions?: string | null;
  trainerId?: string | null;
  status: MemberStatus;
  joinDate?: string | null;
  joinedAt?: string | null;
  branch?: { id: string; name: string; code?: string } | null;
  rfidTag?: string | null;
  profilePhotoUrl?: string | null;
  xp?: MemberXP | null;
  badges?: MemberBadge[];
  activeMembership?: Membership | null;
  memberships?: Membership[];
  dues?: Due[];
  createdAt: string;
  updatedAt: string;
  user?: User;
  trainer?: User | null;
}

// ─── Member Stats ─────────────────────────────────────────────────────────────

export interface MemberStats {
  totalAttendance: number;
  attendanceThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkoutsCompleted: number;
  totalXP: number;
  level: number;
  pendingDues: number;
  memberSince: string;
}
