// apps/web/src/components/forms/MembershipForm.tsx

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface MembershipFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    name: string;
    duration: number;
    price: number;
  }) => void;
  membership?: {
    name?: string;
    duration?: number;
    price?: number;
    description?: string;
  } | null;
}

export default function MembershipForm({
  open,
  onClose,
  onSubmit,
  membership,
}: MembershipFormProps) {
  const [name, setName] = useState(
    membership?.name || ""
  );
  const [duration, setDuration] = useState(
    membership?.duration?.toString() || ""
  );
  const [price, setPrice] = useState(
    membership?.price?.toString() || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      duration: Number(duration),
      price: Number(price),
    };

    onSubmit?.(payload);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Membership Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Name"
          placeholder="Premium Plan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="number"
          label="Duration (Days)"
          placeholder="30"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <Input
          type="number"
          label="Price"
          placeholder="1999"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit">
            Save Membership
          </Button>
        </div>
      </form>
    </Modal>
  );
}