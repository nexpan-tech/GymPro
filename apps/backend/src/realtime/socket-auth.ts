import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type SocketUser = {
  id: string;
  email: string;
  role: string;
  gymId?: string;
};

export function verifySocketToken(token?: string): SocketUser | null {
  try {
    if (!token) return null;

    const cleanToken = token.replace("Bearer ", "");

    return jwt.verify(cleanToken, env.JWT_SECRET) as SocketUser;
  } catch {
    return null;
  }
}