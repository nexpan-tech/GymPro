export interface Attendance {
  id: string;
  gymId?: string;
  memberId?: string;
  checkInAt: string;
  checkOutAt?: string | null;
  date: string;
  status?: "CHECKED_IN" | "CHECKED_OUT";
  source?: "QR" | "MANUAL" | "ADMIN";
  createdAt?: string;
}

export interface QrScanResult {
  memberId: string;
  gymId: string;
  token: string;
  expiresAt?: string;
}
