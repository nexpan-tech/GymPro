import { useState } from "react";
import { dietService } from "@/services/diet.service";

export default function DietForm({ onSuccess }: any) {
  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await dietService.create({
      ...form,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
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