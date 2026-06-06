import { useState, type ChangeEvent, type FormEvent } from "react";
import { trainerService } from "../../services/trainer.service";
import type { Trainer } from "../../types/user.types";

interface Props {
  initialData?: Partial<Trainer>;
  onSuccess?: () => void;
}

type TrainerFormState = {
  name: string;
  email: string;
  password: string;
  specialization: string;
  experience: string;
};

export default function TrainerForm({ initialData, onSuccess }: Props) {
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState<TrainerFormState>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    specialization: initialData?.specialization || "",
    experience: initialData?.experience?.toString() || "0",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      if (initialData?.id) {
        await trainerService.update(initialData.id, { name: form.name });
      } else {
        await trainerService.create({
          gymId: "",
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }
      onSuccess?.();
    } catch {
      setError("Failed to save trainer. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="input" />
      <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="input" disabled={isEdit} />
      {!isEdit ? (
        <input name="password" type="password" placeholder="Temporary password" value={form.password} onChange={handleChange} className="input" />
      ) : null}
      <input name="specialization" placeholder="Specialization (not stored yet)" value={form.specialization} onChange={handleChange} className="input" />
      <input name="experience" type="number" placeholder="Experience (not stored yet)" value={form.experience} onChange={handleChange} className="input" />

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save Trainer"}</button>
    </form>
  );
}
