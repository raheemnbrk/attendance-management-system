import type { PrismaClient, User } from "@prisma/client";
import { prisma } from "../../shared/lib/prisma";
import type { AuthUser } from "../../shared/types/auth";
import { AppError } from "../../shared/utils/app-error";
import {
  REFRESH_TOKEN_TTL_MS,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt";
import {
  comparePassword,
  generateRandomPassword,
  hashPassword,
} from "../../shared/utils/password";
import type {
  ChangePasswordInput,
  CreateEmployeeInput,
  EmployerStatusQuery,
  ListEmployeesQuery,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterEmployerInput,
  RejectEmployerInput,
  ResetEmployeePasswordInput,
  UpdateEmployeeInput,
  UpdateProfileInput,
} from "./user.schema";

export type PublicUser = Omit<User, "passwordHash">;

type TokenDb = Pick<PrismaClient, "refreshToken">;

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

async function issueTokenPair(user: Pick<User, "id" | "role">, db: TokenDb = prisma) {
  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

async function revokeAllRefreshTokens(userId: string, db: TokenDb = prisma): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status === "PENDING") {
    throw new AppError(403, "Your account is awaiting approval");
  }

  if (user.status === "REJECTED") {
    throw new AppError(403, `Your account was rejected${user.rejectionReason ? `: ${user.rejectionReason}` : ""}`);
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is deactivated");
  }

  const tokens = await issueTokenPair(user);

  return {
    ...tokens,
    user: toPublicUser(user),
  };
}

export async function refresh(input: RefreshInput) {
  const payload = verifyRefreshToken(input.refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(input.refreshToken) },
  });

  if (!storedToken) {
    throw new AppError(401, "Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    await revokeAllRefreshTokens(storedToken.userId);
    throw new AppError(401, "Invalid refresh token");
  }

  if (storedToken.expiresAt.getTime() <= Date.now() || storedToken.userId !== payload.id) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });

  if (!user) {
    throw new AppError(401, "Invalid refresh token");
  }

  if (user.status === "PENDING") {
    throw new AppError(403, "Your account is awaiting approval");
  }

  if (user.status === "REJECTED") {
    throw new AppError(403, `Your account was rejected${user.rejectionReason ? `: ${user.rejectionReason}` : ""}`);
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is deactivated");
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (claimed.count === 0) {
      await revokeAllRefreshTokens(user.id, tx);
      throw new AppError(401, "Invalid refresh token");
    }

    return issueTokenPair(user, tx);
  });
}

export async function logout(input: LogoutInput): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(input.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function registerEmployer(input: RegisterEmployerInput): Promise<{ userId: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "EMPLOYER",
      company: input.company,
      status: "PENDING",
    },
    select: { id: true },
  });

  return { userId: user.id };
}

async function findEmployerOrThrow(id: string) {
  const employer = await prisma.user.findFirst({ where: { id, role: "EMPLOYER" } });

  if (!employer) {
    throw new AppError(404, "Employer not found");
  }

  return employer;
}

export async function listEmployers(query: EmployerStatusQuery): Promise<PublicUser[]> {
  const employers = await prisma.user.findMany({
    where: { role: "EMPLOYER", status: query.status },
    orderBy: { createdAt: "desc" },
  });

  return employers.map(toPublicUser);
}

export async function approveEmployer(id: string): Promise<PublicUser> {
  await findEmployerOrThrow(id);

  const employer = await prisma.user.update({
    where: { id },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      reviewedAt: new Date(),
    },
  });

  return toPublicUser(employer);
}

export async function rejectEmployer(id: string, input: RejectEmployerInput): Promise<PublicUser> {
  await findEmployerOrThrow(id);

  const employer = await prisma.user.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: input.reason ?? null,
      reviewedAt: new Date(),
    },
  });

  return toPublicUser(employer);
}

export function getCurrentUser(user: AuthUser): AuthUser {
  return user;
}

export async function updateProfile(user: AuthUser, input: UpdateProfileInput): Promise<PublicUser> {
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name,
      company: input.company,
    },
  });

  return toPublicUser(updated);
}

export async function changePassword(user: AuthUser, input: ChangePasswordInput): Promise<{ id: string }> {
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser) {
    throw new AppError(401, "Account not found");
  }

  const currentPasswordMatches = await comparePassword(input.currentPassword, dbUser.passwordHash);

  if (!currentPasswordMatches) {
    throw new AppError(400, "Current password is incorrect");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: dbUser.id }, data: { passwordHash } });
    // All sessions are revoked so the user must sign in again everywhere.
    await tx.refreshToken.updateMany({
      where: { userId: dbUser.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return { id: dbUser.id };
}

export async function createEmployee(employerId: string, input: CreateEmployeeInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const temporaryPassword = input.password ?? generateRandomPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const employee = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      department: input.department,
      role: "EMPLOYEE",
      status: "APPROVED",
      employerId,
    },
  });

  return {
    employee: toPublicUser(employee),
    temporaryPassword: input.password ? undefined : temporaryPassword,
  };
}

export async function listEmployees(employerId: string, query: ListEmployeesQuery): Promise<PublicUser[]> {
  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      employerId,
      isActive: query.isActive,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
  });

  return employees.map(toPublicUser);
}

export async function getEmployee(employerId: string, id: string): Promise<PublicUser> {
  const employee = await prisma.user.findFirst({
    where: { id, role: "EMPLOYEE", employerId },
  });

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return toPublicUser(employee);
}

export async function updateEmployee(
  employerId: string,
  id: string,
  input: UpdateEmployeeInput,
): Promise<PublicUser> {
  await getEmployee(employerId, id);

  const employee = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      department: input.department,
    },
  });

  return toPublicUser(employee);
}

export async function resetEmployeePassword(
  employerId: string,
  id: string,
  input: ResetEmployeePasswordInput,
): Promise<{ temporaryPassword?: string }> {
  await getEmployee(employerId, id);

  const temporaryPassword = input.password ?? generateRandomPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return input.password ? {} : { temporaryPassword };
}

export async function setEmployeeActive(
  employerId: string,
  id: string,
  isActive: boolean,
): Promise<PublicUser> {
  await getEmployee(employerId, id);

  if (!isActive) {
    await revokeAllRefreshTokens(id);
  }

  const employee = await prisma.user.update({
    where: { id },
    data: { isActive },
  });

  return toPublicUser(employee);
}
