import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { EmployerSummary } from "../types/auth";
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

  // Employees also need their employer's public summary in the session payload:
  // an employer's name and company, never the full user row or credentials.
  let employer: EmployerSummary | null = null;

  // An employee of a suspended employer is blocked too, even when their own
  // account is active. Independent employees (no employer) pass through.
  if (user.role === "EMPLOYEE" && user.employerId) {
    const employerUser = await prisma.user.findUnique({
      where: { id: user.employerId },
      select: { id: true, name: true, company: true, isActive: true },
    });

    if (employerUser) {
      if (!employerUser.isActive) {
        throw new AppError(403, "Your employer account is suspended");
      }

      employer = {
        id: employerUser.id,
        name: employerUser.name,
        company: employerUser.company,
      };
    }
  }

  // A user with a temporary password may only inspect their profile, change
  // their password or log out until the password is changed.
  if (user.mustChangePassword && !isPasswordGateExempt(req)) {
    throw new AppError(403, "Password change required");
  }

  req.user = { ...authUser, employer };
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
