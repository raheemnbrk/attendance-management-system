import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../shared/config/env";
import { AppError } from "../../shared/utils/app-error";

// Short-lived JWT tokens shown as a QR code on a screen at the office entrance.
// Employees scan them to check in / out. The secret is dedicated to this
// feature (ATTENDANCE_QR_SECRET) and never used for authentication tokens.

export const QR_TOKEN_TTL_SECONDS = 30;

const QR_PURPOSE = "attendance";

export type EntryQr = {
  token: string;
  /** ISO instant at which the QR stops working (TTL seconds after issuance). */
  expiresAt: string;
  ttlSeconds: number;
};

const INVALID_QR_MESSAGE = "Invalid or expired QR code. Scan the code displayed at the entrance.";

function invalidQrError(): AppError {
  return new AppError(400, INVALID_QR_MESSAGE, "INVALID_QR");
}

type EntryTokenPayload = JwtPayload & {
  purpose: string;
  employerId: string;
  jti: string;
};

/** Mints a fresh entry token for an employer's entrance display. */
export function createEntryToken(employerId: string): EntryQr {
  const token = jwt.sign(
    { employerId, purpose: QR_PURPOSE },
    env.ATTENDANCE_QR_SECRET,
    { expiresIn: QR_TOKEN_TTL_SECONDS, jwtid: randomUUID(), algorithm: "HS256" },
  );
  return {
    token,
    expiresAt: new Date(Date.now() + QR_TOKEN_TTL_SECONDS * 1000).toISOString(),
    ttlSeconds: QR_TOKEN_TTL_SECONDS,
  };
}

export type VerifiedQrToken = {
  jti: string;
};

/**
 * Verifies a scanned token against the employer the requesting employee
 * belongs to. Every failure — bad signature, expiry, wrong purpose, foreign
 * employer — is collapsed into the same generic error so nothing reveals
 * which check failed.
 */
export function verifyEntryToken(token: string, expectedEmployerId: string | null): VerifiedQrToken {
  let payload: JwtPayload | null = null;
  try {
    const decoded = jwt.verify(token, env.ATTENDANCE_QR_SECRET, { algorithms: ["HS256"] });
    if (typeof decoded !== "string") {
      payload = decoded;
    }
  } catch {
    throw invalidQrError();
  }

  if (!payload || payload.purpose !== QR_PURPOSE) {
    throw invalidQrError();
  }
  if (typeof payload.employerId !== "string" || payload.employerId !== expectedEmployerId) {
    throw invalidQrError();
  }
  if (typeof payload.jti !== "string") {
    throw invalidQrError();
  }

  return { jti: payload.jti };
}

// Light replay protection: the ids of consumed tokens, kept in memory with a
// TTL equal to the token lifetime. A token cannot be reused by the same
// employee (nor genuinely replayed at all), and the cache is empty on restart,
// because tokens from before the restart can no longer verify (they are
// expired by then).
const usedTokenIds = new Map<string, number>();

function pruneUsedTokens(now: number): void {
  for (const [key, expiresAt] of usedTokenIds) {
    if (expiresAt <= now) {
      usedTokenIds.delete(key);
    }
  }
}

/**
 * Records that an employee just confirmed a token so the same jti can never be
 * used twice by the same employee while it still could be valid.
 */
export function claimEntryTokenUsage(employeeId: string, { jti }: VerifiedQrToken): void {
  const now = Date.now();
  pruneUsedTokens(now);

  const key = `${employeeId}:${jti}`;
  if (usedTokenIds.has(key)) {
    throw invalidQrError();
  }
  usedTokenIds.set(key, now + QR_TOKEN_TTL_SECONDS * 1000);
}
