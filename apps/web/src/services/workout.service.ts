import api from "@/lib/axios";

export const workoutService = {
  getAll: async () => {
    const res = await api.get("/workouts");
    return res.data.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post("/workouts", data);
    return res.data;
  },
};