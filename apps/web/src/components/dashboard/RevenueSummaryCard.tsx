// apps/web/src/components/dashboard/RevenueSummaryCard.tsx

import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

interface RevenueSummaryCardProps {
  totalRevenue?: number;
  monthlyRevenue?: number;
  pendingPayments?: number;
  growthRate?: number;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function RevenueSummaryCard({
  totalRevenue = 485000,
  monthlyRevenue = 82000,
  pendingPayments = 18500,
  growthRate = 18.4,
}: RevenueSummaryCardProps) {
  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: Wallet,
      iconBg:
        "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    },
    {
      label: "This Month",
      value: formatCurrency(monthlyRevenue),
      icon: TrendingUp,
      iconBg:
        "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
    },
    {
      label: "Pending",
      value: formatCurrency(pendingPayments),
      icon: CreditCard,
      iconBg:
        "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    },
  ];

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      {/* Premium glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-muted via-primary to-primary" />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Revenue Summary
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground dark:text-white">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground dark:bg-muted dark:text-muted-foreground">
          <ArrowUpRight className="h-4 w-4" />
          {growthRate}%
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-2xl border border-border bg-muted px-4 py-3 dark:border-border dark:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </span>
              </div>

              <span className="text-sm font-bold text-foreground dark:text-white">
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}