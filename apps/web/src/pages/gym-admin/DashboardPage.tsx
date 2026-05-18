// apps/web/src/pages/gym-admin/DashboardPage.tsx

import {
  Users,
  IndianRupee,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MembershipChart from "@/components/dashboard/MembershipChart";
import AttendanceHeatmap from "@/components/dashboard/AttendanceHeatmap";
import PaymentStatusChart from "@/components/dashboard/PaymentStatusChart";
import TopTrainers from "@/components/dashboard/TopTrainers";
import UpcomingRenewals from "@/components/dashboard/UpcomingRenewals";
import RecentPayments from "@/components/dashboard/RecentPayments";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Gym Dashboard"
        description="Monitor members, revenue, attendance, trainers, and renewals."
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard 
          title="Total Members"
          value={248}
          subtitle="221 active members"
          icon={Users}
          trend={12.4}
          color="blue"
        />

        <KPICard
          title="Monthly Revenue"
          value="₹82,000"
          subtitle="Total ₹4,85,000"
          icon={IndianRupee}
          trend={18.6}
          color="emerald"
        />

        <KPICard
          title="Today's Attendance"
          value={96}
          subtitle="Members checked in"
          icon={CalendarCheck}
          trend={5.2}
          color="violet"
        />

        <KPICard
          title="Expiring Memberships"
          value={14}
          subtitle="Renewals required"
          icon={AlertTriangle}
          trend={-2.1}
          color="amber"
        />
      </div>

      {/* Revenue + Membership */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChart />
        <MembershipChart />
      </div>

      {/* Attendance + Payments */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceHeatmap />
        <PaymentStatusChart />
      </div>

      {/* Trainers + Renewals */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TopTrainers />
        <UpcomingRenewals />
      </div>

      {/* Recent Payments + Notifications */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentPayments />
        <NotificationsPanel />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}