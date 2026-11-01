import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/jwt";
import { asyncHandler } from "../utils/async-handler";

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid or expired access token");
  }

  const { passwordHash: _passwordHash, ...authUser } = user;

  // An employee of a suspended employer is blocked too, even when their own
  // account is active. Independent employees (no employer) pass through.
  if (user.role === "EMPLOYEE" && user.employerId) {
    const employer = await prisma.user.findUnique({
      where: { id: user.employerId },
      select: { isActive: true },
    });

    if (employer && !employer.isActive) {
      throw new AppError(403, "Your employer account is suspended");
    }
  }

  // A user with a temporary password may only inspect their profile, change
  // their password or log out until the password is changed.
  if (user.mustChangePassword && !isPasswordGateExempt(req)) {
    throw new AppError(403, "Password change required");
  }

  req.user = authUser;
  next();
});

// Exempt from the mustChangePassword gate, keyed on "<METHOD> <full path>"
// (baseUrl holds the mount prefix when the middleware runs inside a router).
function isPasswordGateExempt(req: Request): boolean {
  const route = `${req.method} ${req.baseUrl}${req.path}`;
  return (
    route === "GET /api/users/me" ||
    route === "PATCH /api/users/me/password" ||
    route === "POST /api/users/logout"
  );
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action"));
      return;
    }

    next();
  };
}

export function requireApproved(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  if (req.user.status !== "APPROVED") {
    next(new AppError(403, "Account is not approved"));
    return;
  }

  next();
}
