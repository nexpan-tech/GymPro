import api from "@/lib/axios";

export const workoutService = {
  getAll: async () => {
    const res = await api.get("/workouts");
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await api.post("/workouts", data);
    return res.data;
  },
};