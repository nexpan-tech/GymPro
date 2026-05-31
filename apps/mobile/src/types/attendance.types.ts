export interface Attendance {
  id: string;
  gymId?: string;
  memberId?: string;
  checkInAt: string;
  date: string;
  createdAt?: string;
}

export interface QrScanResult {
  memberId: string;
  gymId: string;
  token: string;
  expiresAt?: string;
}
