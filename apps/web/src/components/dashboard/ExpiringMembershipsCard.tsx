// apps/web/src/components/dashboard/ExpiringMembershipsCard.tsx

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ExpiringMembershipsCardProps {
  count?: number;
  thisWeek?: number;
  thisMonth?: number;
}

export default function ExpiringMembershipsCard({
  count = 14,
  thisWeek = 8,
  thisMonth = 26,
}: ExpiringMembershipsCardProps) {
  return (
    <Card className="rounded-3xl border border-amber-200/70 bg-linear-to-br from-amber-50 to-orange-50 p-6 shadow-xl dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:bg-slate-900/95">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Expiring Memberships
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Renewals requiring attention
          </p>
        </div>
      </div>

      <div className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
        {count}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-800/60">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Expiring This Week
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {thisWeek}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-800/60">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Expiring This Month
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {thisMonth}
          </span>
        </div>
      </div>
    </Card>
  );
}