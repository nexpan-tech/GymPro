import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { attendanceService } from "@/services/attendance.service";
import type { Attendance } from "@/types/attendance.types";

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttendance = useCallback(async () => {
    try {
      const data = await attendanceService.getMyAttendance();
      setRecords(Array.isArray(data) ? data : []);
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

  const thisMonthCount = useMemo(() => {
    const now = new Date();

    return records.filter((record) => {
      const date = new Date(record.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [records]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History"
        description="View your gym check-ins and monthly consistency."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="premium" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            This Month
          </p>
          <h2 className="mt-2 text-3xl font-black text-(--text-primary)">
            {thisMonthCount}
          </h2>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            Total Check-ins
          </p>
          <h2 className="mt-2 text-3xl font-black text-(--text-primary)">
            {records.length}
          </h2>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-sm font-semibold text-(--text-secondary)">
            Status
          </p>
          <h2 className="mt-2 text-3xl font-black text-muted-foreground">
            Active
          </h2>
        </Card>
      </div>

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