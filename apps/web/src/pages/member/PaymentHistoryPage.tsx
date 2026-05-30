import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/types/payment.types";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentService.list();
      const data = response.data?.payments ?? [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const totalPaid = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  if (loading) {
    return <div className="text-(--text-secondary)">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History"
        description="View your membership payments and billing status."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="premium" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            Total Paid
          </p>
          <h2 className="mt-2 text-3xl font-black text-(--text-primary)">
            ₹{totalPaid.toLocaleString()}
          </h2>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            Payments
          </p>
          <h2 className="mt-2 text-3xl font-black text-(--text-primary)">
            {payments.length}
          </h2>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            Status
          </p>
          <h2 className="mt-2 text-3xl font-black text-emerald-500">
            Good
          </h2>
        </Card>
      </div>

      <Card variant="glass">
        <CardContent className="p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-(--surface-secondary)">
              <tr>
                <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                  Amount
                </th>
                <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                  Method
                </th>
                <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                  Status
                </th>
                <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-(--border)">
                    <td className="px-5 py-4 font-bold text-(--text-primary)">
                      ₹{payment.amount}
                    </td>
                    <td className="px-5 py-4 text-(--text-secondary)">
                      {payment.method || "N/A"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-(--text-secondary)">
                      {(payment as any).paidAt
                        ? new Date((payment as any).paidAt).toLocaleDateString()
                        : (payment as any).date
                          ? new Date((payment as any).date).toLocaleDateString()
                          : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-(--text-secondary)"
                  >
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}