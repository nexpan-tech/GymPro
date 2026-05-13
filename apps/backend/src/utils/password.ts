import bcrypt from "bcryptjs";

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