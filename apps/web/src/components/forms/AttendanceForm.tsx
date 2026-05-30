import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { attendanceService } from "@/services/attendance.service";
import type { Attendance } from "@/types/attendance.types";

interface AttendanceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attendance?: Attendance | null;
}

export default function AttendanceForm({
  open,
  onClose,
  onSuccess,
  attendance,
}: AttendanceFormProps) {
  const [formData, setFormData] = useState({
    gymId: attendance?.gymId || "",
    memberId: attendance?.memberId || "",
    date: attendance?.date
      ? new Date(attendance.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await attendanceService.mark(formData);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Attendance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Gym ID"
          name="gymId"
          value={formData.gymId}
          onChange={handleChange}
          required
        />

        <Input
          label="Member ID"
          name="memberId"
          value={formData.memberId}
          onChange={handleChange}
          required
        />

        <Input
          label="Date & Time"
          name="date"
          type="datetime-local"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" loading={loading}>
            {attendance ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}