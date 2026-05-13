import { prisma } from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../utils/response";
import { RegisterInput, LoginInput } from "./auth.validation";

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role || "MEMBER",
        gymId: data.gymId!,
      },
    });

    const token = generateToken({
      id: user.id,
      role: user.role,
      gymId: user.gymId,
    });

    return { user, token };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      gymId: user.gymId,
    });

    return { user, token };
  }

  static async me(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { memberProfile: true },
    });
  }
}