export interface Payment {
  id: string;

  amount: number;

  method?: string;

  status: "PAID" | "PENDING" | "OVERDUE";

  paidAt?: string;
  date?: string;

  createdAt?: string;
}