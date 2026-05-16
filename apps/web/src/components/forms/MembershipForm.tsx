import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Membership } from "@/pages/gym-admin/MembershipsPage";

interface MembershipFormProps {
  open: boolean;
  membership?: Membership | null;
  onClose: () => void;
  onSubmit: (data: Partial<Membership>) => void;
}

export default function MembershipForm({
  open,
  membership,
  onClose,
  onSubmit,
}: MembershipFormProps) {
  const [form, setForm] = useState({
    name: "",
    duration: 1,
    price: 0,
    description: "",
  });

  useEffect(() => {
    if (membership) {
      setForm({
        name: membership.name || "",
        duration: membership.duration || 1,
        price: membership.price || 0,
        description: membership.description || "",
      });
    } else {
      setForm({
        name: "",
        duration: 1,
        price: 0,
        description: "",
      });
    }
  }, [membership, open]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "duration" || name === "price"
          ? Number(value)
          : value,
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
      title={
        membership
          ? "Edit Membership Plan"
          : "Add Membership Plan"
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Plan Name"
          className="w-full rounded-lg border px-4 py-2"
          required
        />

        <input
          type="number"
          name="duration"
          value={form.duration}
          onChange={handleChange}
          placeholder="Duration (Months)"
          className="w-full rounded-lg border px-4 py-2"
          min={1}
          required
        />

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full rounded-lg border px-4 py-2"
          min={0}
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full rounded-lg border px-4 py-2"
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit">
            {membership
              ? "Update Plan"
              : "Create Plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}