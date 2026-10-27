import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const TEMPORARY_PASSWORD_LENGTH = 10;
const TEMPORARY_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateRandomPassword(length: number = TEMPORARY_PASSWORD_LENGTH): string {
  const bytes = randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += TEMPORARY_PASSWORD_CHARS[bytes[i] % TEMPORARY_PASSWORD_CHARS.length];
  }

  return password;
}
