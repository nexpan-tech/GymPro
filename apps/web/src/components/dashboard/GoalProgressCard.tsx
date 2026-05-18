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
    <Card className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Target className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track your business target
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          {unit}
          {current.toLocaleString("en-IN")}
        </div>

        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {percentage.toFixed(0)}%
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-600"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Target: {unit}
        {target.toLocaleString("en-IN")}
      </div>
    </Card>
  );
}