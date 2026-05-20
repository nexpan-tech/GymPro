import type { UserRole } from "@/types/user.types";

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  SUPER_ADMIN: "/super-admin/dashboard",
  ADMIN: "/gym-admin/dashboard",
  GYM_ADMIN: "/gym-admin/dashboard",
  RECEPTIONIST: "/gym-admin/dashboard",
  TRAINER: "/trainer/dashboard",
  MEMBER: "/member/dashboard",
};

export function hasRole(
  userRole: UserRole | undefined | null,
  allowedRoles: UserRole[]
) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function getRoleDashboard(role?: UserRole | null) {
  if (!role) return "/login";
  return ROLE_DASHBOARD[role] || "/login";
}

export function isGymAdminRole(role?: UserRole | null) {
  return role === "ADMIN" || role === "GYM_ADMIN";
}

export function getSidebarRoleKey(role?: UserRole | null) {
  if (role === "SUPER_ADMIN") return "super_admin";
  if (role === "ADMIN" || role === "GYM_ADMIN" || role === "RECEPTIONIST") {
    return "gym_admin";
  }
  if (role === "TRAINER") return "trainer";
  if (role === "MEMBER") return "member";

  return "member";
}