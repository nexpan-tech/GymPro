import { Role } from "@prisma/client";

export const ROLES = {
  SUPER_ADMIN: Role.SUPER_ADMIN,
  ADMIN: Role.ADMIN,
  RECEPTIONIST: Role.RECEPTIONIST,
  TRAINER: Role.TRAINER,
  MEMBER: Role.MEMBER,
} as const;