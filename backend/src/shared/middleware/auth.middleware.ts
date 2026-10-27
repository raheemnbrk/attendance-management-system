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
  req.user = authUser;
  next();
});

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
