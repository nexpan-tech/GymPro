import { apiClient } from './client';
import { unwrapListResponse, unwrapApiResponse } from '../lib/api-response';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
}

export interface MemberSubscription {
  status: string;
  endDate?: string | null;
  planName?: string | null;
}

export async function getMyInvoices(): Promise<Invoice[]> {
  return unwrapListResponse<Invoice>(await apiClient.get('/invoices/my'));
}

// Member "subscription status" = their current membership (Gym → Member layer).
export async function getMyMembershipStatus(): Promise<MemberSubscription | null> {
  const res = await apiClient.get('/memberships/my');
  const data = unwrapApiResponse<{ current?: { status?: string; endDate?: string; planRef?: { name?: string }; plan?: string } }>(res);
  const cur = data?.current;
  if (!cur) return null;
  return { status: cur.status ?? 'UNKNOWN', endDate: cur.endDate ?? null, planName: cur.planRef?.name ?? cur.plan ?? null };
}
