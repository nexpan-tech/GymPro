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
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "This Month",
      value: formatCurrency(monthlyRevenue),
      icon: TrendingUp,
      iconBg:
        "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
    {
      label: "Pending",
      value: formatCurrency(pendingPayments),
      icon: CreditCard,
      iconBg:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
  ];

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      {/* Premium glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 via-indigo-500 to-cyan-500" />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Revenue Summary
          </p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </h3>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
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
              className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {metric.label}
                </span>
              </div>

              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}