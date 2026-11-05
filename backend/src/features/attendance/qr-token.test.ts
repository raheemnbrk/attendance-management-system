import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "../../shared/config/env";
import { AppError } from "../../shared/utils/app-error";
import {
  claimEntryTokenUsage,
  createEntryToken,
  QR_TOKEN_TTL_SECONDS,
  verifyEntryToken,
} from "./qr-token";

const INVALID_QR_MESSAGE = "Invalid or expired QR code. Scan the code displayed at the entrance.";
const employerId = "employer-abc";
const employeeId = "employee-123";

/** Signs an arbitrary payload with the real secret, keeping it valid for the full TTL. */
function signDirect(payload: Record<string, unknown>): string {
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + QR_TOKEN_TTL_SECONDS,
    },
    env.ATTENDANCE_QR_SECRET,
    { algorithm: "HS256" },
  );
}

function expectInvalidQr(error: unknown): void {
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).message).toBe(INVALID_QR_MESSAGE);
  expect((error as AppError).code).toBe("INVALID_QR");
}

describe("entry QR tokens", () => {
  let token: string;

  beforeAll(() => {
    token = createEntryToken(employerId).token;
  });

  it("uses a short, 30 second lifetime", () => {
    expect(QR_TOKEN_TTL_SECONDS).toBe(30);
  });

  it("verifies a freshly minted token for the right employer", () => {
    const { jti } = verifyEntryToken(token, employerId);
    expect(jti).toBeTruthy();
  });

  it("keeps the token payload employer-bound", () => {
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect(payload.employerId).toBe(employerId);
    expect(payload.purpose).toBe("attendance");
    expect(payload.jti).toBeTruthy();
  });

  it("rejects a foreign employer's token", () => {
    const other = signDirect({ employerId: "somebody-else", purpose: "attendance", jti: randomUUID() });
    try {
      verifyEntryToken(other, employerId);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }
  });

  it("rejects a token with another purpose", () => {
    const otherPurpose = signDirect({ employerId, purpose: "some-other-app", jti: randomUUID() });
    try {
      verifyEntryToken(otherPurpose, employerId);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign(
      {
        employerId,
        purpose: "attendance",
        jti: randomUUID(),
        // Signature stays valid; only the expiry is in the past.
        exp: Math.floor(Date.now() / 1000) - QR_TOKEN_TTL_SECONDS,
      },
      env.ATTENDANCE_QR_SECRET,
      { algorithm: "HS256" },
    );
    try {
      verifyEntryToken(expired, employerId);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }
  });

  it("rejects a tampered token and random QR text", () => {
    try {
      verifyEntryToken(`${token.slice(0, -3)}abc`, employerId);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }

    try {
      verifyEntryToken(randomUUID(), employerId);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }
  });

  it("blocks replay of the same token by the same employee", () => {
    const fresh = createEntryToken(employerId).token;
    const verified = verifyEntryToken(fresh, employerId);
    claimEntryTokenUsage(employeeId, verified);

    try {
      claimEntryTokenUsage(employeeId, verified);
      throw new Error("expected rejection");
    } catch (error) {
      expectInvalidQr(error);
    }
  });
});
