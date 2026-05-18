// src/pages/gym-admin/AnalyticsPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  Calendar,
} from "lucide-react";

import RevenueChart from "@/components/dashboard/RevenueChart";
import AttendanceHeatmap from "@/components/dashboard/AttendanceHeatmap";
import MembershipChart from "@/components/dashboard/MembershipChart";
import KPICard from "@/components/dashboard/KPICard";
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

  type AnalyticsApiResponse = {
    stats?: unknown;
    revenue?: unknown;
    attendance?: AnalyticsData["attendanceTrend"];
    memberships?: unknown;
  };

  const isRecordArray = (
    value: unknown
  ): value is Array<Record<string, unknown>> =>
    Array.isArray(value);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const response =
        (await analyticsService.getGymAnalytics()) as AnalyticsApiResponse;

      // Normalize API response safely
      function statValue(stats: unknown, key: string) {
        if (!isRecordArray(stats)) return 0;
        const found = stats.find((s) => {
          const title =
            String(s.title ?? s.name ?? "").toLowerCase();
          return title.includes(key.toLowerCase());
        });
        return Number(found?.value ?? found?.data ?? 0);
      }

      const normalized: AnalyticsData = {
        totalMembers: statValue(response?.stats, "member") || 0,
        activeMembers: statValue(response?.stats, "active") || 0,
        totalRevenue: statValue(response?.stats, "revenue") || 0,
        monthlyRevenue: isRecordArray(response.revenue)
          ? response.revenue.map((item) => ({
              month: String(item.date ?? item.month ?? ""),
              revenue: Number(item.revenue ?? 0),
            }))
          : [],
        attendanceTrend: Array.isArray(response?.attendance)
          ? response.attendance
          : [],
        membershipDistribution: isRecordArray(response.memberships)
          ? response.memberships.map((item) => ({
              name: String(item.name ?? item.date ?? ""),
              value: Number(item.active ?? item.value ?? 0),
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnalytics();
  }, [loadAnalytics]);

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
        <KPICard
          title="Total Members"
          value={data.totalMembers}
          icon={Users}
          color="from-sky-500 to-indigo-600"
        />

        <KPICard
          title="Active Members"
          value={data.activeMembers}
          icon={Activity}
          color="from-emerald-500 to-teal-600"
        />

        <KPICard
          title="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString("en-IN")}`}
          icon={CreditCard}
          color="from-purple-500 to-fuchsia-600"
        />

        <KPICard
          title="Active Rate"
          value={`${activePercentage}%`}
          icon={TrendingUp}
          color="from-orange-500 to-amber-600"
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

          <AttendanceHeatmap
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