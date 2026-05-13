export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  RECEPTIONIST: "RECEPTIONIST",
  TRAINER: "TRAINER",
  MEMBER: "MEMBER",
} as const;

export type Role = keyof typeof ROLES;