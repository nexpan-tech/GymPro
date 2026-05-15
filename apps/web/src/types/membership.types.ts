export interface Membership {
  id: string;
  gymId: string;
  memberId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "paused";
  price: number;
}