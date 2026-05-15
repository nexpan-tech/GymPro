import { useState } from "react";
import { membershipService } from "../../services/membership.service";
import { Membership } from "../../types/membership.types";

interface Props {
  initialData?: Partial<Membership>;
  onSuccess?: () => void;
}

export default function MembershipForm({ initialData, onSuccess }: Props) {
  const [form, setForm] = useState({
    memberId: initialData?.memberId || "",
    planName: initialData?.planName || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    price: initialData?.price || 0,
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (initialData?.id) {
      await membershipService.update(initialData.id, form);
    } else {
      await membershipService.create(form);
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="memberId" placeholder="Member ID" onChange={handleChange} className="input" />
      <input name="planName" placeholder="Plan Name" onChange={handleChange} className="input" />
      <input name="startDate" type="date" onChange={handleChange} className="input" />
      <input name="endDate" type="date" onChange={handleChange} className="input" />
      <input name="price" type="number" onChange={handleChange} className="input" />

      <button className="btn">Save Membership</button>
    </form>
  );
}