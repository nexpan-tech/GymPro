export interface StatCardData {
  title: string;
  value: number | string;
  change?: number;
  icon?: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface AttendancePoint {
  date: string;
  present: number;
  absent: number;
}

export interface MembershipPoint {
  date: string;
  active: number;
  expired: number;
}

export interface Activity {
  id: string;
  message: string;
  time: string;
}

export interface DashboardAnalytics {
  stats: StatCardData[];
  revenue: RevenuePoint[];
  attendance: AttendancePoint[];
  memberships: MembershipPoint[];
  recentActivity: Activity[];
}