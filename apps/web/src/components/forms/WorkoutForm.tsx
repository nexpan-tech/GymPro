import { useState } from "react";
import { workoutService } from "@/services/workout.service";

interface WorkoutFormProps {
  onSuccess?: () => void;
}

export default function WorkoutForm({ onSuccess }: WorkoutFormProps) {
  const [form, setForm] = useState({
    goal: "",
    notes: "",
  });

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    await workoutService.create({
      goal: form.goal,
      notes: form.notes,
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="goal" placeholder="Workout Goal" onChange={(e) => setForm({ ...form, goal: e.target.value })} className="input" />
      <input name="notes" placeholder="Notes" onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
      <button className="btn-primary w-full">Create Workout</button>
    </form>
  );
}