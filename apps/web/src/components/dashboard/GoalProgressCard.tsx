// apps/web/src/components/dashboard/GoalProgressCard.tsx

import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface GoalProgressCardProps {
  title?: string;
  current?: number;
  target?: number;
  unit?: string;
}

export default function GoalProgressCard({
  title = "Monthly Revenue Goal",
  current = 82000,
  target = 100000,
  unit = "₹",
}: GoalProgressCardProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15 dark:text-primary">
          <Target className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Track your business target
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div className="text-3xl font-bold text-foreground dark:text-white">
          {unit}
          {current.toLocaleString("en-IN")}
        </div>

        <div className="text-sm font-medium text-muted-foreground">
          {percentage.toFixed(0)}%
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-muted dark:bg-muted">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        Target: {unit}
        {target.toLocaleString("en-IN")}
      </div>
    </Card>
  );
}