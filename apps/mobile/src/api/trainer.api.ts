import { api } from "./client";
import type { TrainerProfile, AssignedMember } from "../types/trainer.types";
import type { Attendance } from "../types/attendance.types";
import type { User } from "../types/auth.types";

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string | null;
  memberId?: string | null;
  exercises?: unknown[];
  createdAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TrainerStats {
  totalAssignedMembers: number;
  activeMembers: number;
  workoutPlansCreated: number;
  attendancesToday: number;
  sessionsThisMonth?: number | null;
}


export const trainerApi = {
  getMyProfile: async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return unwrap<User>(res);
  },

  getAssignedMembers: async (
    page = 1
  ): Promise<AssignedMember[]> => {
    const res = await api.get("/members", {
      params: { trainerId: "me", page, limit: 20 },
    });
    const result = unwrap<PaginatedResult<AssignedMember> | AssignedMember[]>(res);
    return Array.isArray(result) ? result : result.data;
  },

  getMemberDetail: async (id: string): Promise<AssignedMember> => {
    const res = await api.get(`/members/${id}`);
    return unwrap<AssignedMember>(res);
  },

  getMyWorkoutPlans: async (): Promise<WorkoutPlan[]> => {
    const res = await api.get("/workouts", { params: { trainerId: "me" } });
    const result = unwrap<PaginatedResult<WorkoutPlan> | WorkoutPlan[]>(res);
    return Array.isArray(result) ? result : result.data;
  },

  getTrainerStats: async (): Promise<TrainerStats> => {
    const res = await api.get("/trainer-analytics/stats");
    return unwrap<TrainerStats>(res);
  },

  getTodayAttendance: async (): Promise<Attendance[]> => {
    const today = new Date().toISOString().split("T")[0];
    const res = await api.get("/attendance", { params: { date: today } });
    const result = unwrap<PaginatedResult<Attendance> | Attendance[]>(res);
    return Array.isArray(result) ? result : result.data;
  },
};
