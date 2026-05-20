import { api } from "../lib/api";

export interface Payment {
  id: string;
  amount: number;
  status: string;
  method?: string;
  createdAt?: string;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const paymentService = {
  getMyPayments: async (): Promise<Payment[]> => {
    const res = await api.get("/payments/my");
    return unwrap<Payment[]>(res);
  },
};