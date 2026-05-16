// src/pages/gym-admin/AnalyticsPage.tsx

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  Calendar,
} from "lucide-react";

import RevenueChart from "@/components/dashboard/RevenueChart";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import MembershipChart from "@/components/dashboard/MembershipChart";
import { analyticsService } from "@/services/analytics.service";

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  attendanceTrend: Array<{
    date: string;
    present: number;
    absent: number;
  }>;
  membershipDistribution: Array<{
    name: string;
    value: number;
  }>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    monthlyRevenue: [],
    attendanceTrend: [],
    membershipDistribution: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const response = await analyticsService.getGymAnalytics();

      // Normalize API response safely
      function statValue(stats: any, key: string) {
        if (!Array.isArray(stats)) return (stats && stats[key]) || 0;
        const found = stats.find((s: any) => {
          const title = (s.title || s.name || "").toString().toLowerCase();
          return title.includes(key.toLowerCase());
        });
        return found?.value ?? found?.data ?? 0;
      }

      const normalized: AnalyticsData = {
        totalMembers: statValue(response?.stats, "member") || 0,
        activeMembers: statValue(response?.stats, "active") || 0,
        totalRevenue: statValue(response?.stats, "revenue") || 0,
        monthlyRevenue: Array.isArray(response?.revenue)
          ? (response.revenue as any[]).map((item: any) => ({
              month: item.date || item.month || "",
              revenue: item.revenue || 0,
            }))
          : [],
        attendanceTrend: Array.isArray(response?.attendance)
          ? response.attendance
          : [],
        membershipDistribution: Array.isArray(response?.memberships)
          ? (response.memberships as any[]).map((item: any) => ({
              name: item.name || item.date || "",
              value: item.active || item.value || 0,
            }))
          : [],
      };

      setData(normalized);
    } catch (error) {
      console.error("Failed to load analytics:", error);

      // Safe fallback data
      setData({
        totalMembers: 0,
        activeMembers: 0,
        totalRevenue: 0,
        monthlyRevenue: [],
        attendanceTrend: [],
        membershipDistribution: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const activePercentage = useMemo(() => {
    if (!data.totalMembers) return 0;
    return Math.round(
      (data.activeMembers / data.totalMembers) * 100
    );
  }, [data.activeMembers, data.totalMembers]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics
        </h1>
        <p className="mt-1 text-gray-500">
          Track business performance, revenue, and member trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Members"
          value={data.totalMembers}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Members"
          value={data.activeMembers}
          icon={Activity}
          color="bg-green-50 text-green-600"
        />

        <StatCard
          title="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString("en-IN")}`}
          icon={CreditCard}
          color="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Active Rate"
          value={`${activePercentage}%`}
          icon={TrendingUp}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Revenue
          </h2>
        </div>

        <RevenueChart
          data={
            Array.isArray(data.monthlyRevenue)
              ? data.monthlyRevenue.map((item) => ({
                  month: item.month || "",
                  revenue: item.revenue || 0,
                }))
              : []
          }
        />
      </div>

      {/* Attendance + Membership Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Trend
            </h2>
          </div>

          <AttendanceChart
            data={
              Array.isArray(data.attendanceTrend)
                ? data.attendanceTrend
                : []
            }
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Membership Distribution
            </h2>
          </div>

          <MembershipChart
            data={
              Array.isArray(data.membershipDistribution)
                ? data.membershipDistribution
                : []
            }
          />
        </div>
      </div>
    </div>
  );
}