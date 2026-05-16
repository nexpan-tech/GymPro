import StatCard from "@/components/dashboard/StatCard";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";

interface TrainerDashboardData {
  assignedMembers: number;
  todayAttendance: number;
  activeWorkoutPlans: number;
  activeDietPlans: number;
  attendanceTrend: any[];
  recentActivity: any[];
}

export default function TrainerDashboardPage() {
  const [data, setData] = useState<TrainerDashboardData>({
    assignedMembers: 0,
    todayAttendance: 0,
    activeWorkoutPlans: 0,
    activeDietPlans: 0,
    attendanceTrend: [],
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await analyticsService.getTrainerAnalytics();

      setData({
        assignedMembers: (res as any)?.assignedMembers ?? 0,
        todayAttendance: (res as any)?.todayAttendance ?? 0,
        activeWorkoutPlans: (res as any)?.activeWorkoutPlans ?? 0,
        activeDietPlans: (res as any)?.activeDietPlans ?? 0,
        attendanceTrend: Array.isArray((res as any)?.attendance)
          ? (res as any).attendance
          : [],
        recentActivity: Array.isArray((res as any)?.recentActivity)
          ? (res as any).recentActivity
          : [],
      });
    } catch (error) {
      console.error("Failed to load trainer dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Assigned Members"
          value={data.assignedMembers}
        />
        <StatCard
          title="Today's Attendance"
          value={data.todayAttendance}
        />
        <StatCard
          title="Workout Plans"
          value={data.activeWorkoutPlans}
        />
        <StatCard
          title="Diet Plans"
          value={data.activeDietPlans}
        />
      </div>

      <AttendanceChart data={data.attendanceTrend} />

      <RecentActivity data={data.recentActivity} />
    </div>
  );
}