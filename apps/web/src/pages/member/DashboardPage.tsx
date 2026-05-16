import StatCard from "@/components/dashboard/StatCard";
import AttendanceChart from "@/components/dashboard/AttendanceChart";

export default function MemberDashboardPage() {
  const attendanceData = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 1 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 1 },
    { label: "Fri", value: 1 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Days Attended"
          value={22}
        />
        <StatCard
          title="Membership"
          value="Active"
        />
        <StatCard
          title="Payments Made"
          value={8}
        />
        <StatCard
          title="Workout Plans"
          value={3}
        />
      </div>

      {/* Attendance Chart */}
      <AttendanceChart data={attendanceData} />

      {/* Membership Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">
          Membership Summary
        </h2>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Plan:</strong> Premium Monthly</p>
          <p><strong>Start Date:</strong> 01 May 2026</p>
          <p><strong>Expiry Date:</strong> 31 May 2026</p>
          <p><strong>Status:</strong> Active</p>
        </div>
      </div>
    </div>
  );
}