import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "./app-error";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "7d";
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  id: string;
  role: Role;
}

export interface RefreshTokenPayload {
  id: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    jwtid: randomUUID(),
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
    jwtid: randomUUID(),
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (typeof decoded === "string" || typeof decoded.id !== "string") {
      throw new Error("Invalid payload");
    }

    return { id: decoded.id };
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof decoded === "string" || typeof decoded.id !== "string" || typeof decoded.role !== "string") {
      throw new Error("Invalid payload");
    }

    return { id: decoded.id, role: decoded.role as Role };
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
