export interface Attendance {
  id: string;

  gymId: string;
  memberId: string;

  checkInAt: string;
  date: string;

  createdAt?: string;
}