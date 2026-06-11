import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import type { CreateUserInput, UpdateUserInput } from "./user.validation";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "RECEPTIONIST"
  | "TRAINER"
  | "MEMBER";

// Roles a gym admin is permitted to provision inside their own gym. This
// prevents privilege escalation (e.g. a gym admin minting a SUPER_ADMIN or a
// cross-gym manager role) — the create route is already gym-scoped via gymId.
const GYM_ASSIGNABLE_ROLES: ReadonlyArray<CreateUserInput["role"]> = [
  "ADMIN",
  "RECEPTIONIST",
  "TRAINER",
  "MEMBER",
];

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  gymId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const createUser = async (
  gymId: string,
  payload: CreateUserInput
) => {
  if (!GYM_ASSIGNABLE_ROLES.includes(payload.role)) {
    throw new AppError(
      `Gym admins cannot create users with the role ${payload.role}`,
      403
    );
  }

  const existing = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existing) {
    throw new AppError("User already exists with this email", 400);
  }

  const passwordHash = await hashPassword(payload.password);

  return prisma.user.create({
    data: {
      gymId,
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role as UserRole,
      isActive: true,
    },
    select: safeUserSelect,
  });
};

/** Roles considered "staff/admin" — shown on the Admins page. */
export const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "BRANCH_MANAGER", "REGIONAL_MANAGER"] as const;

export const getUsers = async (gymId: string, opts: { roles?: string[] } = {}) => {
  return prisma.user.findMany({
    where: {
      gymId,
      ...(opts.roles && opts.roles.length ? { role: { in: opts.roles as never } } : {}),
    },
    select: safeUserSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
};

/** Generate a readable one-time temporary password. */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return `Gym-${p}`;
}

/**
 * Reset a staff/trainer login password. Sets the supplied password or generates
 * a one-time temporary one (returned ONCE). Gym-scoped — cannot touch other gyms
 * or the SUPER_ADMIN.
 */
export const resetUserPassword = async (gymId: string, id: string, newPassword?: string) => {
  const user = await prisma.user.findFirst({ where: { id, gymId } });
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "SUPER_ADMIN") throw new AppError("Cannot reset a super admin password here", 403);

  const temporaryPassword = newPassword?.trim() || generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return { userId: id, temporaryPassword, generated: !newPassword };
};

export const getUserById = async (
  gymId: string,
  id: string
) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      gymId,
    },
    select: {
      ...safeUserSelect,
      memberProfile: true,
      trainedMembers: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUser = async (
  gymId: string,
  id: string,
  payload: UpdateUserInput
) => {
  if (payload.role && !GYM_ASSIGNABLE_ROLES.includes(payload.role)) {
    throw new AppError(
      `Gym admins cannot assign the role ${payload.role}`,
      403
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      gymId,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (payload.email && payload.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (existing) {
      throw new AppError("Another user already uses this email", 400);
    }
  }

  return prisma.user.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole | undefined,
      isActive: payload.isActive,
    },
    select: safeUserSelect,
  });
};

export const deleteUser = async (
  gymId: string,
  id: string
) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      gymId,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "SUPER_ADMIN") {
    throw new AppError("Cannot delete a super admin", 403);
  }

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: {
        gymId,
        role: "ADMIN",
        isActive: true,
      },
    });

    if (adminCount <= 1) {
      throw new AppError("Cannot delete the last active gym admin", 400);
    }
  }

  // Unassign any members this user trains so the FK never blocks the delete.
  await prisma.member.updateMany({ where: { trainerId: id }, data: { trainerId: null } });

  // If the user has history that would be orphaned (chat, feedback, plans,
  // sessions, audit) we soft-delete instead of hard-deleting.
  const [messages, feedback, plans, sessions, audits] = await Promise.all([
    prisma.trainerMessage.count({ where: { OR: [{ trainerId: id }, { senderId: id }] } }),
    prisma.trainerFeedback.count({ where: { trainerId: id } }),
    prisma.workoutPlan.count({ where: { trainerId: id } }),
    prisma.session.count({ where: { userId: id } }),
    prisma.auditLog.count({ where: { userId: id } }),
  ]);

  if (messages + feedback + plans + sessions + audits > 0) {
    const soft = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: safeUserSelect,
    });
    return { ...soft, softDeleted: true };
  }

  return prisma.user.delete({
    where: {
      id,
    },
    select: safeUserSelect,
  });
};