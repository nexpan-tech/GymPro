import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { ROLES } from "../../constants/roles";

export const createUser = async (gymId: string, payload: any) => {
  const passwordHash = await hashPassword(payload.password);

  return prisma.user.create({
    data: {
      gymId,
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role || ROLES.MEMBER,
    },
  });
};

export const getUsers = async (gymId: string) => {
  return prisma.user.findMany({
    where: { gymId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getUserById = async (gymId: string, id: string) => {
  return prisma.user.findFirst({
    where: { id, gymId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      member: true,
    },
  });
};

export const updateUser = async (gymId: string, id: string, payload: any) => {
  return prisma.user.updateMany({
    where: { id, gymId },
    data: payload,
  });
};

export const deleteUser = async (gymId: string, id: string) => {
  return prisma.user.deleteMany({
    where: { id, gymId },
  });
};