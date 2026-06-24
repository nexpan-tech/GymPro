import bcrypt from "bcryptjs";
import { AppError } from "./response";

/**
 * Validate password strength for admin-set passwords. Throws AppError(422) when
 * the password is too weak. Rules: ≥8 chars, at least one letter and one number.
 * Keep in sync with the web-side hint copy.
 */
export const assertStrongPassword = (password: unknown): string => {
  const p = typeof password === "string" ? password : "";
  if (p.length < 8) throw new AppError("Password must be at least 8 characters", 422);
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) {
    throw new AppError("Password must contain at least one letter and one number", 422);
  }
  return p;
};

/**
 * Hash password before storing
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password during login
 */
export const comparePassword = async (
  password: string,
  hashed: string
) => {
  return bcrypt.compare(password, hashed);
};