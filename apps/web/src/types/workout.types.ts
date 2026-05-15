export interface Workout {
  id: string;
  name: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
}