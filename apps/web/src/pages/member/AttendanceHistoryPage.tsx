import { useEffect, useState } from "react";
import { attendanceService } from "@/services/attendance.service";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const res = await attendanceService.getAll();
      setRecords(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to load attendance", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading attendance history...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance History</h1>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="px-4 py-3">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {record.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}