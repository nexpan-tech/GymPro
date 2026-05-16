import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Member } from "@/pages/gym-admin/MembersPage";

interface MemberFormProps {
  open: boolean;
  member?: Member | null;
  onClose: () => void;
  onSubmit: (data: Partial<Member>) => void;
}

export default function MemberForm({
  open,
  member,
  onClose,
  onSubmit,
}: MemberFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "Male",
  });

  useEffect(() => {
    if (member) {
      setForm({
        fullName: member.fullName || "",
        phone: member.phone || "",
        email: member.email || "",
        gender: member.gender || "Male",
      });
    } else {
      setForm({
        fullName: "",
        phone: "",
        email: "",
        gender: "Male",
      });
    }
  }, [member, open]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? "Edit Member" : "Add Member"}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full rounded-lg border px-4 py-2"
          required
        />

        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full rounded-lg border px-4 py-2"
          required
        />

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="w-full rounded-lg border px-4 py-2"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-2"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit">
            {member ? "Update Member" : "Create Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}