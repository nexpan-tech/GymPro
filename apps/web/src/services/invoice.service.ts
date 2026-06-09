import { api } from "@/lib/api";

// Member-billing invoices (Gym → Member) with GST.
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerGST?: string | null;
  subtotal: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  member?: { user?: { name: string } } | null;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const invoiceService = {
  listMine: async (): Promise<Invoice[]> =>
    unwrap<Invoice[]>(await api.get("/invoices/my")) ?? [],
  listForGym: async (): Promise<Invoice[]> =>
    unwrap<Invoice[]>(await api.get("/invoices")) ?? [],
  getById: async (id: string): Promise<Invoice> =>
    unwrap<Invoice>(await api.get(`/invoices/${id}`)),
};
