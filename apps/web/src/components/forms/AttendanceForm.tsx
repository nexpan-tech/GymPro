import { useState } from "react";
import { attendanceService } from "../../services/attendance.service";
import { Attendance } from "../../types/attendance.types";

interface Props {
  initialData?: Partial<Attendance>;
  onSuccess?: () => void;
}

export default function AttendanceForm({ initialData, onSuccess }: Props) {
  const [form, setForm] = useState({
    memberId: initialData?.memberId || "",
    date: initialData?.date || "",
    status: initialData?.status || "present",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (initialData?.id) {
      await attendanceService.update(initialData.id, form);
    } else {
      await attendanceService.mark(form);
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="memberId"
        placeholder="Member ID"
        onChange={handleChange}
        className="input"
      />

      <input
        name="date"
        type="date"
        onChange={handleChange}
        className="input"
      />

      <select name="status" onChange={handleChange} className="input">
        <option value="present">Present</option>
        <option value="absent">Absent</option>
      </select>

      <button className="btn">Save Attendance</button>
    </form>
  );
}