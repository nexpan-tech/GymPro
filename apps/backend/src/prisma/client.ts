import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger";

/**
 * Prisma Singleton Client
 * Prevents multiple connections in dev + supports hot reload safely
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

/**
 * Attach to global in dev to avoid reconnecting on hot reload
 */
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Graceful shutdown handling
 * Important for SaaS stability
 */
const disconnect = async (signal: string) => {
  try {
    await prisma.$disconnect();
    logger.info(`🛑 Prisma disconnected due to ${signal}`);
    process.exit(0);
  } catch (err) {
    logger.error("❌ Error during Prisma disconnect", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => disconnect("SIGINT"));
process.on("SIGTERM", () => disconnect("SIGTERM"));