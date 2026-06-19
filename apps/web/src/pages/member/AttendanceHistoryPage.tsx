import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Flame, Trophy, CalendarRange, Percent } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { attendanceService } from "@/services/attendance.service";
import { memberService, type MemberStreak } from "@/services/member.service";
import type { Attendance } from "@/types/attendance.types";

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [streak, setStreak] = useState<MemberStreak | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAttendance = useCallback(async () => {
    try {
      const [data, streakData] = await Promise.all([
        attendanceService.getMyAttendance(),
        memberService.getStreak().catch(() => null),
      ]);
      setRecords(Array.isArray(data) ? data : []);
      setStreak(streakData);
    } catch (error) {
      console.error("Failed to load attendance", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading attendance...</div>;
  }

  const streakCards = [
    { label: "Current Streak", value: streak?.current ?? 0, suffix: "days", Icon: Flame, accent: true },
    { label: "Best Streak", value: streak?.best ?? 0, suffix: "days", Icon: Trophy, accent: false },
    { label: "Monthly Streak", value: streak?.thisMonth.streak ?? 0, suffix: "days", Icon: CalendarRange, accent: false },
    { label: "Attendance Rate", value: streak?.thisMonth.consistency ?? 0, suffix: "%", Icon: Percent, accent: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History"
        description="View your gym check-ins and monthly consistency."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {streakCards.map(({ label, value, suffix, Icon, accent }) => (
          <Card key={label} variant={accent ? "premium" : "glass"} padding="md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--text-secondary)">{label}</p>
              <Icon className={`h-4 w-4 ${accent ? "text-(--flame)" : "text-(--text-muted)"}`} />
            </div>
            <h2 className="mt-2 text-3xl font-black text-(--text-primary)">
              {value}
              <span className="ml-1 text-base font-semibold text-(--text-secondary)">{suffix}</span>
            </h2>
          </Card>
        ))}
      </div>
      <p className="-mt-2 text-xs text-(--text-muted)">
        Streaks count operational days only — Sundays don't break your streak.
      </p>

      <Card variant="glass">
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-(--surface-secondary)">
                <tr>
                  <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                    Check-in Time
                  </th>
                  <th className="px-5 py-4 text-left font-bold text-(--text-secondary)">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-border"
                    >
                      <td className="px-5 py-4 font-semibold text-(--text-primary)">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-(--text-secondary)">
                        {record.checkInAt
                          ? new Date(record.checkInAt).toLocaleTimeString()
                          : "N/A"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Present
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-10 text-center text-(--text-secondary)"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}