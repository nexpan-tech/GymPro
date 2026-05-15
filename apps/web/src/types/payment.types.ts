export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  method: "cash" | "card" | "upi" | "bank";
  status: "paid" | "pending" | "failed";
  date: string;
}