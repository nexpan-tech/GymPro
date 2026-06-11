// apps/web/src/components/dashboard/RecentPayments.tsx

import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface PaymentItem {
  id: number | string;
  memberName: string;
  amount: number;
  planName: string;
  status: "PAID" | "PENDING" | "FAILED";
  date: string;
}

interface RecentPaymentsProps {
  data?: PaymentItem[];
}

const fallbackPayments: PaymentItem[] = [
  {
    id: 1,
    memberName: "Arun Kumar",
    amount: 2500,
    planName: "Monthly Plan",
    status: "PAID",
    date: "Today",
  },
  {
    id: 2,
    memberName: "Priya Sharma",
    amount: 7500,
    planName: "Quarterly Plan",
    status: "PAID",
    date: "Yesterday",
  },
  {
    id: 3,
    memberName: "Rahul Das",
    amount: 2500,
    planName: "Monthly Plan",
    status: "PENDING",
    date: "2 days ago",
  },
  {
    id: 4,
    memberName: "Sneha Reddy",
    amount: 12000,
    planName: "Annual Plan",
    status: "FAILED",
    date: "3 days ago",
  },
];

function getStatusIcon(status: PaymentItem["status"]) {
  switch (status) {
    case "PAID":
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    case "PENDING":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "FAILED":
      return <AlertCircle className="h-4 w-4 text-primary" />;
  }
}

function getStatusBadge(status: PaymentItem["status"]) {
  switch (status) {
    case "PAID":
      return "bg-muted text-muted-foreground";
    case "PENDING":
      return "bg-muted text-muted-foreground";
    case "FAILED":
      return "bg-primary text-white dark:text-primary";
  }
}

export default function RecentPayments({
  data = fallbackPayments,
}: RecentPaymentsProps) {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Recent Payments
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest transactions received
          </p>
        </div>

        <div className="rounded-xl bg-muted-foreground p-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-4">
        {data.map((payment) => (
          <div
            key={payment.id}
            className="rounded-2xl border border-border p-4 transition hover:shadow-md dark:border-border"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-foreground dark:text-white">
                  {payment.memberName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {payment.planName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{payment.date}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-foreground dark:text-white">
                  ₹{payment.amount.toLocaleString()}
                </p>

                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(
                    payment.status
                  )}`}
                >
                  {getStatusIcon(payment.status)}
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}