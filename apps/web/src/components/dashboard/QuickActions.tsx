// apps/web/src/components/dashboard/QuickActions.tsx

import {
  UserPlus,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Utensils,
  Bell,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Link } from "react-router-dom";

interface ActionItem {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const actions: ActionItem[] = [
  {
    label: "Add Member",
    description: "Register a new gym member",
    icon: UserPlus,
    path: "/gym-admin/members",
    color:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  },
  {
    label: "Record Payment",
    description: "Add a new payment entry",
    icon: CreditCard,
    path: "/gym-admin/payments",
    color:
      "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
  },
  {
    label: "Mark Attendance",
    description: "Check in members",
    icon: CalendarCheck,
    path: "/gym-admin/attendance",
    color:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  },
  {
    label: "Workout Plans",
    description: "Manage training programs",
    icon: Dumbbell,
    path: "/gym-admin/workout-plans",
    color:
      "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
  },
  {
    label: "Diet Plans",
    description: "Create nutrition plans",
    icon: Utensils,
    path: "/gym-admin/diet-plans",
    color:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  },
  {
    label: "Notifications",
    description: "Send updates to members",
    icon: Bell,
    path: "/gym-admin/notifications",
    color:
      "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
  },
];

export default function QuickActions() {
  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          Quick Actions
        </h3>
        <p className="text-sm text-muted-foreground">
          Common tasks for gym management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              to={action.path}
              className="group rounded-2xl border border-border bg-muted p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-border dark:bg-muted"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${action.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h4 className="font-semibold text-foreground dark:text-white">
                {action.label}
              </h4>

              <p className="mt-1 text-sm text-muted-foreground">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}