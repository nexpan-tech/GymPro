import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import MembershipChart from "@/components/dashboard/MembershipChart";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function GymAdminDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analyticsService.getDashboardAnalytics().then(setData);
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <RevenueChart data={data.revenue} />
        <AttendanceChart data={data.attendance} />
        <MembershipChart data={data.memberships} />
      </div>

      {/* Activity */}
      <RecentActivity data={data.recentActivity || []} />
    </div>
  );
}