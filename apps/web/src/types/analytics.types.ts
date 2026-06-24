// ─── Revenue ──────────────────────────────────────────────────────────────────

export interface RevenueData {
  month: string;
  revenue: number;
  memberCount: number;
}

/** @deprecated Use RevenueData instead */
export interface RevenuePoint {
  date: string;
  revenue: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceStats {
  date: string;
  count: number;
  gymId: string;
  branchId?: string | null;
  peakHour?: number | null;
}

/** @deprecated Use AttendanceStats instead */
export interface AttendancePoint {
  date: string;
  present: number;
  absent: number;
}

// ─── Membership Trend ─────────────────────────────────────────────────────────

export interface MembershipPoint {
  date: string;
  active: number;
  expired: number;
}

// ─── Queue Stats (BullMQ / job queues) ───────────────────────────────────────

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused?: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface StatCardData {
  title: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  icon?: string;
  trend?: "up" | "down" | "flat";
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  attendanceToday: number;
  activeSessions: number;
  pendingDues: number;
  openLeads: number;
  expiringMemberships: number;
  // Staff + membership breakdown (separate from members).
  trainers: number;
  receptionists: number;
  staff: number;
  totalMemberships: number;
  activeMemberships: number;
}

export interface Activity {
  id: string;
  message: string;
  time: string;
  type?: string;
}

export interface DashboardAnalytics {
  stats: StatCardData[];
  revenue: RevenueData[];
  attendance: AttendanceStats[];
  memberships: MembershipPoint[];
  recentActivity: Activity[];
}
