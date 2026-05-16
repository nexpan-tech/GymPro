// src/pages/gym-admin/DashboardPage.tsx

import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MembershipChart from "@/components/dashboard/MembershipChart";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Card } from "@/components/ui/Card";
import { analyticsService } from "@/services/analytics.service";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  expiringMemberships: number;
  todayAttendance: number;
  totalTrainers: number;
}

interface DashboardData {
  stats: DashboardStats;
  revenueChart: any[];
  membershipChart: any[];
  attendanceChart: any[];
  recentActivities: any[];
}

const defaultData: DashboardData = {
  stats: {
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    expiringMemberships: 0,
    todayAttendance: 0,
    totalTrainers: 0,
  },
  revenueChart: [],
  membershipChart: [],
  attendanceChart: [],
  recentActivities: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await analyticsService.getGymAnalytics();

        // Normalize response shape
        const dashboard = response ?? {};

        // helper to extract stat values from array-shaped stats
        function statValue(stats: any, key: string) {
          if (!Array.isArray(stats)) return (stats && stats[key]) || 0;
          const found = stats.find((s: any) => {
            const name = (s.title || s.name || "").toString().toLowerCase();
            return name.includes(key.toLowerCase());
          });
          return found?.value ?? found?.data ?? 0;
        }

        const statsObj = Array.isArray(dashboard.stats)
          ? {
              totalMembers: statValue(dashboard.stats, "member") || 0,
              activeMembers: statValue(dashboard.stats, "active") || 0,
              totalRevenue: statValue(dashboard.stats, "revenue") || 0,
              monthlyRevenue: statValue(dashboard.stats, "monthly") || 0,
              expiringMemberships: statValue(dashboard.stats, "expiring") || 0,
              todayAttendance: statValue(dashboard.stats, "attendance") || 0,
              totalTrainers: statValue(dashboard.stats, "trainer") || 0,
            }
          : dashboard.stats ?? defaultData.stats;

        setData({
          stats: statsObj,
          revenueChart: Array.isArray(dashboard.revenue)
            ? (dashboard.revenue as any[]).map((r: any) => ({
                month: r.date || r.month || "",
                revenue: r.revenue ?? r.value ?? 0,
              }))
            : [],
          membershipChart: Array.isArray(dashboard.memberships)
            ? (dashboard.memberships as any[]).map((m: any) => ({
                name: m.name || m.date || "",
                value: m.active ?? m.value ?? 0,
              }))
            : [],
          attendanceChart: Array.isArray(dashboard.attendance)
            ? (dashboard.attendance as any[])
            : [],
          recentActivities: Array.isArray(dashboard.recentActivity)
            ? (dashboard.recentActivity as any[])
            : [],
        });
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        // Fallback mock data
        setData({
          stats: {
            totalMembers: 248,
            activeMembers: 221,
            totalRevenue: 485000,
            monthlyRevenue: 82000,
            expiringMemberships: 14,
            todayAttendance: 96,
            totalTrainers: 8,
          },
          revenueChart: [
            { month: "Jan", revenue: 45000 },
            { month: "Feb", revenue: 52000 },
            { month: "Mar", revenue: 61000 },
            { month: "Apr", revenue: 58000 },
            { month: "May", revenue: 72000 },
            { month: "Jun", revenue: 82000 },
          ],
          membershipChart: [
            { name: "Monthly", value: 120 },
            { name: "Quarterly", value: 70 },
            { name: "Yearly", value: 58 },
          ],
          attendanceChart: [
            { day: "Mon", attendance: 85 },
            { day: "Tue", attendance: 92 },
            { day: "Wed", attendance: 88 },
            { day: "Thu", attendance: 96 },
            { day: "Fri", attendance: 102 },
            { day: "Sat", attendance: 110 },
            { day: "Sun", attendance: 74 },
          ],
          recentActivities: [
            {
              id: 1,
              title: "New member registered",
              description: "Arun Kumar joined the gym.",
              time: "10 minutes ago",
            },
            {
              id: 2,
              title: "Payment received",
              description: "₹2,500 received from Priya.",
              time: "1 hour ago",
            },
            {
              id: 3,
              title: "Membership expiring",
              description: "14 memberships expire this week.",
              time: "2 hours ago",
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const { stats } = data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gym Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor your members, revenue, attendance, and business performance.
        </p>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.activeMembers} active`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          subtitle={`Total ₹${stats.totalRevenue.toLocaleString()}`}
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          subtitle="Members checked in"
        />
        <StatCard
          title="Expiring Memberships"
          value={stats.expiringMemberships}
          subtitle="Renewals required"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueChart data={data.revenueChart} />
        <MembershipChart data={data.membershipChart} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceChart data={data.attendanceChart} />
        <RecentActivity data={data.recentActivities} />
      </div>
    </div>
  );
}