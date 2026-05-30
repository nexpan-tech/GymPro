import { Attendance } from "../../types/attendance.types";
import { attendanceService } from "../../services/attendance.service";

interface Props {
  data: Attendance[];
  onEdit: (item: Attendance) => void;
  onRefresh: () => void;
}

export default function AttendanceTable({ data, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    await attendanceService.remove(id);
    onRefresh();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Member</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((a) => (
          <tr key={a.id}>
            <td>{a.memberId}</td>
            <td>{a.date}</td>
            <td>Present</td>
            <td className="space-x-2">
              <button onClick={() => onEdit(a)}>Edit</button>
              <button onClick={() => handleDelete(a.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}