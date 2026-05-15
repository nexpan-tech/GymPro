import { useEffect, useState } from "react";
import { attendanceService } from "../../services/attendance.service";
import { Attendance } from "../../types/attendance.types";
import AttendanceTable from "../../components/tables/AttendanceTable";
import AttendanceForm from "../../components/forms/AttendanceForm";

export default function AttendancePage() {
  const [data, setData] = useState<Attendance[]>([]);
  const [selected, setSelected] = useState<Attendance | null>(null);

  const load = async () => {
    const res = await attendanceService.getAll();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Attendance</h1>

      <AttendanceForm
        initialData={selected || undefined}
        onSuccess={() => {
          setSelected(null);
          load();
        }}
      />

      <AttendanceTable
        data={data}
        onEdit={(item) => setSelected(item)}
        onRefresh={load}
      />
    </div>
  );
}