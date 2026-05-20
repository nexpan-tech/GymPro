import { AppError } from "./response";

export interface TenantUser {
  id: string;
  role: string;
  gymId: string | null;
}

export function requireGym(user: TenantUser): string {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  return user.gymId;
}