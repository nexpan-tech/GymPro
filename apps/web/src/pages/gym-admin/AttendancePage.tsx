import { useCallback, useEffect, useState } from "react";
import Page from "@/components/ui/Page";
import Button from "@/components/ui/Button";
import AttendanceForm from "@/components/forms/AttendanceForm";
import type { Attendance } from "@/types/attendance.types";
import AttendanceTable from "@/components/tables/AttendanceTable";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import { attendanceService } from "@/services/attendance.service";

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceService.list();
      const records = res.data?.attendance ?? [];
      setRecords(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Failed to load attendance:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAttendance();
  }, [loadAttendance]);

  return (
    <Page title="Attendance">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditingRecord(null);
            setOpen(true);
          }}
        >
          Mark Attendance
        </Button>
      </div>

      {loading ? (
        <Loader />
      ) : records.length === 0 ? (
        <EmptyState message="No attendance records found." />
      ) : (
        <AttendanceTable
          data={records}
          onEdit={(record) => {
            setEditingRecord(record);
            setOpen(true);
          }}
          onRefresh={loadAttendance}
        />
      )}

      <AttendanceForm
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={loadAttendance}
        attendance={editingRecord}
      />
    </Page>
  );
}