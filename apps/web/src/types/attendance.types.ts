export type AttendanceStatus = "CHECKED_IN" | "CHECKED_OUT";
export type AttendanceSource = "QR" | "MANUAL" | "ADMIN";

export interface AttendanceMemberRef {
  id: string;
  user?: { id: string; name: string; email: string };
  trainer?: { id: string; name: string; email: string } | null;
  branch?: { id: string; name: string } | null;
}

export interface Attendance {
  id: string;

  gymId: string;
  memberId: string;
  branchId?: string | null;

  checkInAt: string;
  checkOutAt?: string | null;
  date: string;

  status?: AttendanceStatus;
  source?: AttendanceSource;

  member?: AttendanceMemberRef;

  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceAnalytics {
  todayCheckIns: number;
  currentOccupancy: number;
  totalCheckIns: number;
  avgDailyAttendance: number;
  windowDays: number;
  trend: { date: string; count: number }[];
  peakHours: { hour: number; count: number }[];
}

export interface LiveOccupancy {
  occupancy: number;
  members: Attendance[];
}

export interface GymQr {
  gymId: string;
  gymName: string;
  qrValue: string;
  dataUrl: string;
}
