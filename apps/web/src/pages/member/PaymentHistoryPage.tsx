import { useCallback, useEffect, useState } from "react";
import { api } from "@/constants/api";
import type { Payment } from "@/types/payment.types";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get("/payments");
      const data = res.data?.data || res.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPayments();
  }, [fetchPayments]);

  if (loading) {
    return <div className="p-6">Loading payment history...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment History</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-t dark:border-gray-700"
              >
                <td className="p-3">₹{payment.amount}</td>
                <td className="p-3">
                  {payment.method || "N/A"}
                </td>
                <td className="p-3">{payment.status}</td>
                <td className="p-3">
                  {payment.date
                    ? new Date(payment.date).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No payments found.
          </div>
        )}
      </div>
    </div>
  );
}