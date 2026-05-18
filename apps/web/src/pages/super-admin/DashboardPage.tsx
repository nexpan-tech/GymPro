// apps/web/src/pages/super-admin/DashboardPage.tsx

import {
  Building2,
  Users,
  IndianRupee,
  Activity,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MemberGrowthChart from "@/components/dashboard/MemberGrowthChart";
import GymOverviewCard from "@/components/dashboard/GymOverviewCard";
import RevenueSummaryCard from "@/components/dashboard/RevenueSummaryCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Super Admin Dashboard"
        description="Monitor platform-wide gyms, users, subscriptions, and revenue."
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Total Gyms"
          value={128}
          subtitle="12 added this month"
          icon={Building2}
          trend={14.2}
          color="blue"
        />

        <KPICard
          title="Total Users"
          value={18420}
          subtitle="Members + trainers"
          icon={Users}
          trend={11.8}
          color="violet"
        />

        <KPICard
          title="Platform Revenue"
          value="₹12,85,000"
          subtitle="This month"
          icon={IndianRupee}
          trend={22.4}
          color="emerald"
        />

        <KPICard
          title="System Health"
          value="99.98%"
          subtitle="API uptime"
          icon={Activity}
          trend={0.2}
          color="amber"
        />
      </div>

      {/* Revenue + Growth */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChart />
        <MemberGrowthChart />
      </div>

      {/* Overview + Revenue Summary */}
      <div className="grid gap-6 xl:grid-cols-2">
        <GymOverviewCard />
        <RevenueSummaryCard />
      </div>

      {/* Activity + Notifications */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentActivity />
        <NotificationsPanel />
      </div>
    </div>
  );
}