import type { UserRole } from "@/types/user.types";

export function hasRole(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}