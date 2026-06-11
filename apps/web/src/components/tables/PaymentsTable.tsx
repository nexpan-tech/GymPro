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
      return "bg-muted text-muted-foreground";
    case "pending":
      return "bg-muted text-muted-foreground";
    case "failed":
      return "bg-primary/10 text-primary";
    case "refunded":
      return "bg-muted text-foreground";
    default:
      return "bg-muted text-foreground";
  }
}

export default function PaymentsTable({
  payments,
}: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        No payments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-muted text-left text-muted-foreground">
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

        <tbody className="divide-y divide-border">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-muted">
              <td className="px-4 py-3 font-medium text-foreground">
                {payment.id}
              </td>

              <td className="px-4 py-3 text-foreground">
                {"N/A"}
              </td>

              <td className="px-4 py-3 text-foreground">-</td>

              <td className="px-4 py-3 font-semibold text-foreground">
                {formatCurrency(payment.amount)}
              </td>

              <td className="px-4 py-3 text-foreground">
                {payment.method}
              </td>

              <td className="px-4 py-3 text-foreground">
                {payment.date ? formatDate(payment.date) : (payment.paidAt ? formatDate(payment.paidAt) : "-")}
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