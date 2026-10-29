import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { env } from "../config/env";

// Uses the default in-memory store, which is fine for a single instance;
// a shared Redis store (e.g. rate-limit-redis) would be needed to scale
// to several instances.

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  skipSuccessfulRequests?: boolean;
};

// Same { success, message } shape the error middleware returns for AppError.
function handleLimitReached(_req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
  });
}

function skipInTest(): boolean {
  return env.NODE_ENV === "test";
}

function createIpRateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handleLimitReached,
    skip: skipInTest,
  });
}

// Keyed on the authenticated user id instead of the IP. Must run AFTER
// `authenticate` (and role checks) so req.user is set.
function createUserRateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, _res) => req.user!.id,
    handler: handleLimitReached,
    skip: skipInTest,
  });
}

export const globalLimiter = createIpRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_GLOBAL_MAX,
});

// Shared by /users/login and /users/refresh; skipSuccessfulRequests so only
// failed attempts count.
export const authLimiter = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_AUTH_MAX,
  skipSuccessfulRequests: true,
});

export const registerLimiter = createIpRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_REGISTER_MAX,
});

// Apply AFTER `authenticate` on POST /api/attendance/check-in and /check-out
// (attendance feature is not implemented yet).
export const attendanceLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_ATTENDANCE_MAX,
});

export const employerWriteLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_EMPLOYER_WRITE_MAX,
});

// Apply AFTER `authenticate` on GET /api/attendance/export and GET
// /api/attendance/reports/monthly/export so file downloads stay cheap.
export const exportLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_EXPORT_MAX,
});

// Apply AFTER `authenticate` on every admin-only users route; generous
// because the admin dashboard polls stats and lists repeatedly.
export const adminLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_ADMIN_MAX,
});
