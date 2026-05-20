import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: process.env.PORT || 5000,

  DATABASE_URL: process.env.DATABASE_URL as string,

  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  BCRYPT_SALT: Number(process.env.BCRYPT_SALT || 10),

  // Future SaaS expansion
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

