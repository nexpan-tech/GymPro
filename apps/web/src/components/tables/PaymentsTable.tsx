import type { Payment } from "@/types/payment.types";

interface PaymentsTableProps {
  payments: Payment[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-IN");
  } catch {
    return "-";
  }
}

function getStatusClasses(status: string) {
  const s = (status || "").toString().toLowerCase();
  switch (s) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function PaymentsTable({
  payments,
}: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        No payments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3 font-medium">Invoice #</th>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {payment.id}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {payment.memberId ?? "N/A"}
              </td>

              <td className="px-4 py-3 text-gray-700">-</td>

              <td className="px-4 py-3 font-semibold text-gray-900">
                {formatCurrency(payment.amount)}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {payment.method}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {formatDate(payment.date)}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    payment.status
                  )}`}
                >
                  {payment.status?.toString().toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}