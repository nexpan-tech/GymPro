import api from "@/lib/axios";
import type { Payment } from "@/types/payment.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const res = await api.get("/payments");
    return unwrap<Payment[]>(res);
  },

  create: async (data: Partial<Payment>): Promise<Payment> => {
    const res = await api.post("/payments", data);
    return unwrap<Payment>(res);
  },

  update: async (id: string, data: Partial<Payment>): Promise<Payment> => {
    const res = await api.put(`/payments/${id}`, data);
    return unwrap<Payment>(res);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};