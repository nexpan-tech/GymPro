import api from "@/lib/axios";
import type { Payment } from "@/types/payment.types";

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const res = await api.get("/payments");
    return res.data;
  },

  create: async (data: Partial<Payment>): Promise<Payment> => {
    const res = await api.post("/payments", data);
    return res.data;
  },

  update: async (id: string, data: Partial<Payment>): Promise<Payment> => {
    const res = await api.put(`/payments/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};