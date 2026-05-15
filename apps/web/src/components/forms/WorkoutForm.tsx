import { useState } from "react";
import { workoutService } from "@/services/workout.service";

export default function WorkoutForm({ onSuccess }: any) {
  const [form, setForm] = useState({
    name: "",
    level: "beginner",
    duration: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await workoutService.create({
      ...form,
      duration: Number(form.duration),
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="name" placeholder="Workout Name" onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />

      <select onChange={(e) => setForm({ ...form, level: e.target.value })} className="input">
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      <input name="duration" placeholder="Duration (mins)" onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input" />

      <button className="btn-primary w-full">Create Workout</button>
    </form>
  );
}