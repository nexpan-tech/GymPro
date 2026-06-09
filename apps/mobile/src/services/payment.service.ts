import { api } from "../api/client";

export interface Payment {
  id: string;
  amount: number;
  status: string;
  method?: string;
  gateway?: string | null;
  membershipId?: string | null;
  createdAt?: string;
}

export interface CheckoutOrder {
  order: {
    orderId: string;
    amountInPaise: number;
    currency: string;
    provider: string;
    keyId?: string;
  };
  paymentId: string;
}

/** Raised when the payment gateway is not live/configured (HTTP 5xx). */
export class GatewayUnavailableError extends Error {
  constructor(message = "Payment gateway is not live yet") {
    super(message);
    this.name = "GatewayUnavailableError";
  }
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export const paymentService = {
  getMyPayments: async (): Promise<Payment[]> => {
    const res = await api.get("/payments/my");
    return unwrap<Payment[]>(res);
  },

  /**
   * Start a gateway checkout. Throws GatewayUnavailableError when the gateway
   * is not configured/live (backend returns 502/503) so the UI can show a
   * controlled placeholder instead of a raw Axios error.
   */
  createCheckoutOrder: async (payload: {
    amount: number;
    membershipId?: string;
  }): Promise<CheckoutOrder> => {
    try {
      const res = await api.post("/payments/checkout/order", payload);
      return unwrap<CheckoutOrder>(res);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 502 || status === 503) {
        throw new GatewayUnavailableError();
      }
      throw err;
    }
  },

  /** Verify a completed gateway handshake → marks PAID, renews, invoices. */
  verifyCheckout: async (payload: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<unknown> => {
    const res = await api.post("/payments/checkout/verify", payload);
    return unwrap<unknown>(res);
  },
};
