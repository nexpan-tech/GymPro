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
    <Card className="rounded-3xl border border-border bg-linear-to-br from-muted to-muted p-6 shadow-xl dark:border-border dark:from-muted dark:to-muted dark:bg-muted">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-muted p-3 text-muted-foreground dark:bg-muted dark:text-muted-foreground">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Expiring Memberships
          </h3>
          <p className="text-sm text-muted-foreground">
            Renewals requiring attention
          </p>
        </div>
      </div>

      <div className="mb-4 text-4xl font-bold text-foreground dark:text-white">
        {count}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-muted">
          <span className="text-sm text-muted-foreground">
            Expiring This Week
          </span>
          <span className="font-semibold text-foreground dark:text-white">
            {thisWeek}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-muted">
          <span className="text-sm text-muted-foreground">
            Expiring This Month
          </span>
          <span className="font-semibold text-foreground dark:text-white">
            {thisMonth}
          </span>
        </div>
      </div>
    </Card>
  );
}