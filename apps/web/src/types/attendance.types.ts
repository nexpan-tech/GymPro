export interface Attendance {
  id: string;
  gymId: string;
  memberId: string;
  date: string;
  status: "present" | "absent";
}