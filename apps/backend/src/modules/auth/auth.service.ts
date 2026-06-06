import { prisma } from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../utils/jwt";
import { AppError } from "../../utils/response";
import { RegisterInput, LoginInput, RegisterGymInput } from "./auth.validation";

function sanitizeUser(user: any) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function getRefreshExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

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
        gymId: data.gymId ?? null,
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
      branchId: user.branchId,
    });

    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiry(),
      },
    });

    return {
      user: sanitizeUser(user),
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Self-service gym onboarding: create the Gym + its first ADMIN (owner) in a
   * single transaction and return session tokens so the owner is logged in.
   */
  static async registerGym(data: RegisterGymInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError("A user already exists with this email", 400);
    }

    const existingGym = await prisma.gym.findUnique({
      where: { email: data.email },
    });
    if (existingGym) {
      throw new AppError("A gym already exists with this email", 400);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          name: data.gymName,
          email: data.email,
          phone: data.phone ?? null,
        },
      });

      return tx.user.create({
        data: {
          name: data.ownerName,
          email: data.email,
          passwordHash,
          role: "ADMIN",
          gymId: gym.id,
        },
      });
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
      branchId: user.branchId,
    });

    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiry(),
      },
    });

    return {
      user: sanitizeUser(user),
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await comparePassword(data.password, user.passwordHash);

    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
      branchId: user.branchId,
    });

    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshExpiry(),
      },
    });

    return {
      user: sanitizeUser(user),
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user.isActive) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const accessToken = generateAccessToken({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      gymId: session.user.gymId,
      branchId: session.user.branchId,
    });

    return {
      token: accessToken,
      accessToken,
    };
  }

  static async logout(refreshToken: string) {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await prisma.session.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return true;
  }

  static async logoutAll(userId: string) {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return true;
  }

  static async me(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        gym: true,
        memberProfile: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return sanitizeUser(user);
  }
}