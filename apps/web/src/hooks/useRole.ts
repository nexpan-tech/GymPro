import type { UserRole } from "@/types/user.types";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth();

  const role = user?.role as UserRole | undefined;

  return {
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    isGymAdmin: role === "GYM_ADMIN",
    isTrainer: role === "TRAINER",
    isReceptionist: role === "RECEPTIONIST",
    isMember: role === "MEMBER",
  };
}