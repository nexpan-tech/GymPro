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
  specialization: string;
  experience: string;
};

export default function TrainerForm({ initialData, onSuccess }: Props) {
  const [form, setForm] = useState<TrainerFormState>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    specialization: initialData?.specialization || "",
    experience: initialData?.experience?.toString() || "0",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const experienceValue = Number(form.experience);

    const payload: Partial<Trainer> = {
      name: form.name,
      email: form.email,
      specialization: form.specialization,
      experience: Number.isNaN(experienceValue) ? 0 : experienceValue,
    };

    if (initialData?.id) {
      await trainerService.update(initialData.id, payload);
    } else {
      await trainerService.create(payload);
    }

    onSuccess?.();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" onChange={handleChange} className="input" />
      <input name="email" placeholder="Email" onChange={handleChange} className="input" />
      <input name="specialization" placeholder="Specialization" onChange={handleChange} className="input" />
      <input name="experience" type="number" placeholder="Experience" onChange={handleChange} className="input" />

      <button className="btn">Save Trainer</button>
    </form>
  );
}