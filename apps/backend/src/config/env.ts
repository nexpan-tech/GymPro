import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Fail fast in production if a critical secret is missing. Without this guard a
 * missing JWT_SECRET would let jwt.sign() run with `undefined` (insecure /
 * crashing tokens) and a missing DATABASE_URL would surface as opaque Prisma
 * errors deep in request handling. We only hard-fail in production so local dev
 * and the test runner keep their existing behaviour.
 */
if (NODE_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required production environment variable(s): ${missing.join(
        ", ",
      )}. Refusing to start.`,
    );
  }
  if ((process.env.JWT_SECRET as string).length < 16) {
    throw new Error(
      "[env] JWT_SECRET is too short for production (must be >= 16 chars). Refusing to start.",
    );
  }
}

export const env = {
  NODE_ENV,

  PORT: process.env.PORT || 5000,

  DATABASE_URL: process.env.DATABASE_URL as string,

  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  BCRYPT_SALT: Number(process.env.BCRYPT_SALT || 10),

  // Future SaaS expansion
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};
