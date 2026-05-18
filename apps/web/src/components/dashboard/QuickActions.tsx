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
      "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    label: "Record Payment",
    description: "Add a new payment entry",
    icon: CreditCard,
    path: "/gym-admin/payments",
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Mark Attendance",
    description: "Check in members",
    icon: CalendarCheck,
    path: "/gym-admin/attendance",
    color:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  },
  {
    label: "Workout Plans",
    description: "Manage training programs",
    icon: Dumbbell,
    path: "/gym-admin/workout-plans",
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
  {
    label: "Diet Plans",
    description: "Create nutrition plans",
    icon: Utensils,
    path: "/gym-admin/diet-plans",
    color:
      "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  },
  {
    label: "Notifications",
    description: "Send updates to members",
    icon: Bell,
    path: "/gym-admin/notifications",
    color:
      "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
  },
];

export default function QuickActions() {
  return (
    <Card className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Quick Actions
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
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
              className="group rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${action.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h4 className="font-semibold text-slate-900 dark:text-white">
                {action.label}
              </h4>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}