import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        gymId?: string | null;
        role: Role;
      };
    }
  }
}

export {};