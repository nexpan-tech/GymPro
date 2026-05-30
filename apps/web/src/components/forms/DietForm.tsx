import { useState } from "react";
import { dietService } from "@/services/diet.service";

interface DietFormProps {
  onSuccess?: () => void;
}

export default function DietForm({ onSuccess }: DietFormProps) {
  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    await dietService.create({
      goal: form.name,
      notes: `Calories: ${form.calories}, Protein: ${form.protein}g, Carbs: ${form.carbs}g, Fats: ${form.fats}g`,
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="name" placeholder="Diet Name" onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
      <input name="calories" placeholder="Calories" onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input" />
      <input name="protein" placeholder="Protein" onChange={(e) => setForm({ ...form, protein: e.target.value })} className="input" />
      <input name="carbs" placeholder="Carbs" onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="input" />
      <input name="fats" placeholder="Fats" onChange={(e) => setForm({ ...form, fats: e.target.value })} className="input" />

      <button className="btn-primary w-full">Create Diet</button>
    </form>
  );
}