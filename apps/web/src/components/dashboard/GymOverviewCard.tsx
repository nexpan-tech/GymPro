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
        "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
    },
    {
      label: "Active Members",
      value: activeMembers,
      icon: UserCheck,
      color:
        "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    },
    {
      label: "Trainers",
      value: trainers,
      icon: Dumbbell,
      color:
        "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
    },
    {
      label: "Today Attendance",
      value: todayAttendance,
      icon: Activity,
      color:
        "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    },
  ];

  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15 dark:text-primary">
          <Building2 className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            {gymName}
          </h3>
          <p className="text-sm text-muted-foreground">
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
              className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <p className="text-2xl font-bold text-foreground dark:text-white">
                {item.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}