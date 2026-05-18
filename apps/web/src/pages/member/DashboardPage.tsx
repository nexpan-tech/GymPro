// apps/web/src/pages/member/DashboardPage.tsx

import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/dashboard/KPICard";
import GoalProgressCard from "@/components/dashboard/GoalProgressCard";
import AttendanceHeatmap from "@/components/dashboard/AttendanceHeatmap";
import UpcomingRenewals from "@/components/dashboard/UpcomingRenewals";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="My Fitness Dashboard"
        description="Track attendance, workouts, diet plans, and fitness progress."
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Attendance This Month"
          value={22}
          subtitle="3 days missed"
          icon={CalendarCheck}
          trend={8.4}
          color="blue"
        />

        <KPICard
          title="Membership Status"
          value="Active"
          subtitle="Renews in 14 days"
          icon={CreditCard}
          trend={0}
          color="emerald"
        />

        <KPICard
          title="Workout Completion"
          value="86%"
          subtitle="Weekly target"
          icon={Dumbbell}
          trend={12.1}
          color="violet"
        />

        <KPICard
          title="Goal Progress"
          value="78%"
          subtitle="Weight loss target"
          icon={TrendingUp}
          trend={5.7}
          color="amber"
        />
      </div>

      {/* Progress */}
      <div className="grid gap-6 xl:grid-cols-2">
        <GoalProgressCard />
        <AttendanceHeatmap />
      </div>

      {/* Renewals + Notifications */}
      <div className="grid gap-6 xl:grid-cols-2">
        <UpcomingRenewals />
        <NotificationsPanel />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}