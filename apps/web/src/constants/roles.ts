import type { UserRole } from "@/types/user.types";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  GYM_ADMIN: "GYM_ADMIN",
  ADMIN: "ADMIN",
  TRAINER: "TRAINER",
  RECEPTIONIST: "RECEPTIONIST",
  MEMBER: "MEMBER",
} as const satisfies Record<string, UserRole>;