// apps/web/src/pages/trainer/DashboardPage.tsx

import {
  Users,
  CalendarCheck,
  Dumbbell,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/dashboard/KPICard";
import AttendanceHeatmap from "@/components/dashboard/AttendanceHeatmap";
import GoalProgressCard from "@/components/dashboard/GoalProgressCard";
import TopTrainers from "@/components/dashboard/TopTrainers";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Trainer Dashboard"
        description="Track assigned members, workouts, attendance, and performance."
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Assigned Members"
          value={42}
          subtitle="8 new this month"
          icon={Users}
          trend={11.2}
          color="blue"
        />

        <KPICard
          title="Today's Attendance"
          value={28}
          subtitle="Members checked in"
          icon={CalendarCheck}
          trend={4.8}
          color="emerald"
        />

        <KPICard
          title="Workout Plans"
          value={36}
          subtitle="12 updated recently"
          icon={Dumbbell}
          trend={9.4}
          color="violet"
        />

        <KPICard
          title="Client Progress"
          value="87%"
          subtitle="Average goal completion"
          icon={TrendingUp}
          trend={6.3}
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceHeatmap />
        <GoalProgressCard />
      </div>

      {/* Performance + Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TopTrainers />
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}