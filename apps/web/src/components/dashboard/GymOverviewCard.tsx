// apps/web/src/components/dashboard/GymOverviewCard.tsx

import {
  Building2,
  Users,
  UserCheck,
  Dumbbell,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

interface GymOverviewCardProps {
  gymName?: string;
  totalMembers?: number;
  activeMembers?: number;
  trainers?: number;
  todayAttendance?: number;
}

export default function GymOverviewCard({
  gymName = "Titan Fitness Club",
  totalMembers = 248,
  activeMembers = 221,
  trainers = 8,
  todayAttendance = 96,
}: GymOverviewCardProps) {
  const items = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: Users,
      color:
        "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      label: "Active Members",
      value: activeMembers,
      icon: UserCheck,
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Trainers",
      value: trainers,
      icon: Dumbbell,
      color:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      label: "Today Attendance",
      value: todayAttendance,
      icon: Activity,
      color:
        "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    },
  ];

  return (
    <Card className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Building2 className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {gymName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gym performance overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}