import type { Prisma, PrismaClient, User } from "@prisma/client";
import type { AccountStatus, Role } from "@prisma/client";
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
import { instantToISO, isoAddDays, isoToUtcMidnight, todayISO, utcDateToISO } from "../../shared/utils/date";
import type {
  ChangePasswordInput,
  CreateEmployeeInput,
  EmployerEmployeesQuery,
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
  UserListQuery,
} from "./user.schema";

// ---------------------------------------------------------------------------
// Admin platform stats
// ---------------------------------------------------------------------------

export type PlatformStats = {
  employers: { pending: number; approved: number; rejected: number };
  totalEmployees: number;
  checkInsToday: number;
};

export async function getAdminStats(): Promise<PlatformStats> {
  const today = isoToUtcMidnight(todayISO());
  const [pending, approved, rejected, totalEmployees, checkInsToday] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYER", status: "PENDING" } }),
    prisma.user.count({ where: { role: "EMPLOYER", status: "APPROVED" } }),
    prisma.user.count({ where: { role: "EMPLOYER", status: "REJECTED" } }),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.attendance.count({ where: { date: today } }),
  ]);

  return { employers: { pending, approved, rejected }, totalEmployees, checkInsToday };
}

export type TrendEntry = { date: string; count: number };

export type PlatformTrends = {
  registrations: TrendEntry[];
  checkIns: TrendEntry[];
};

export async function getAdminTrends(days: number): Promise<PlatformTrends> {
  const today = todayISO();
  // Rolling window ending today, inclusive of both ends.
  const from = isoAddDays(today, -(days - 1));

  const [registrationTimestamps, checkInCounts] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "EMPLOYER",
        // createdAt is a plain timestamp whose day depends on the timezone, so
        // the query uses a one-day UTC margin on both sides to cover every
        // offset; instants falling outside [from, today] are dropped when
        // bucketing below.
        createdAt: {
          gte: isoToUtcMidnight(isoAddDays(from, -1)),
          lt: isoToUtcMidnight(isoAddDays(today, 2)),
        },
      },
      select: { createdAt: true },
    }),
    prisma.attendance.groupBy({
      by: ["date"],
      where: { date: { gte: isoToUtcMidnight(from), lte: isoToUtcMidnight(today) } },
      _count: { _all: true },
    }),
  ]);

  const registrationsByDay = new Map<string, number>();
  for (const employer of registrationTimestamps) {
    const day = instantToISO(employer.createdAt);
    if (day >= from && day <= today) {
      registrationsByDay.set(day, (registrationsByDay.get(day) ?? 0) + 1);
    }
  }

  const checkInsByDay = new Map<string, number>();
  for (const entry of checkInCounts) {
    checkInsByDay.set(utcDateToISO(entry.date), entry._count._all);
  }

  const registrations: TrendEntry[] = [];
  const checkIns: TrendEntry[] = [];
  for (let day = from; day <= today; day = isoAddDays(day, 1)) {
    registrations.push({ date: day, count: registrationsByDay.get(day) ?? 0 });
    checkIns.push({ date: day, count: checkInsByDay.get(day) ?? 0 });
  }

  return { registrations, checkIns };
}

export type ActivityEventType = "EMPLOYER_REGISTERED" | "EMPLOYER_APPROVED" | "EMPLOYER_REJECTED";

export type ActivityEvent = {
  type: ActivityEventType;
  employerId: string;
  employerName: string;
  company: string | null;
  at: string;
};

type TimestampedActivityEvent = ActivityEvent & { atMs: number };

// Latest employer events, merged from the registration (createdAt) and the
// review decision (reviewedAt, only set together with a final status).
// Existing columns only; no event table.
export async function getAdminActivity(limit: number): Promise<ActivityEvent[]> {
  const employers = await prisma.user.findMany({
    where: { role: "EMPLOYER" },
    select: {
      id: true,
      name: true,
      company: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  const events: TimestampedActivityEvent[] = [];

  for (const employer of employers) {
    events.push({
      type: "EMPLOYER_REGISTERED",
      employerId: employer.id,
      employerName: employer.name,
      company: employer.company,
      at: employer.createdAt.toISOString(),
      atMs: employer.createdAt.getTime(),
    });

    if (employer.reviewedAt && employer.status === "APPROVED") {
      events.push({
        type: "EMPLOYER_APPROVED",
        employerId: employer.id,
        employerName: employer.name,
        company: employer.company,
        at: employer.reviewedAt.toISOString(),
        atMs: employer.reviewedAt.getTime(),
      });
    }

    if (employer.reviewedAt && employer.status === "REJECTED") {
      events.push({
        type: "EMPLOYER_REJECTED",
        employerId: employer.id,
        employerName: employer.name,
        company: employer.company,
        at: employer.reviewedAt.toISOString(),
        atMs: employer.reviewedAt.getTime(),
      });
    }
  }

  events.sort((a, b) => b.atMs - a.atMs);

  return events.slice(0, limit).map(({ atMs: _atMs, ...event }) => event);
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  department: string | null;
  status: AccountStatus;
  isActive: boolean;
  createdAt: Date;
  employerName: string | null;
};

export async function listAllUsers(query: UserListQuery): Promise<Paginated<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    OR: query.search ? buildNameEmailCompanyFilter(query.search) : undefined,
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      // passwordHash is never selected here.
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        department: true,
        status: true,
        isActive: true,
        createdAt: true,
        employer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: users.map(({ employer, ...user }) => ({
      ...user,
      employerName: employer?.name ?? null,
    })),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

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

async function findApprovedEmployerOrThrow(id: string, action: "suspended" | "reactivated") {
  const employer = await findEmployerOrThrow(id);

  if (employer.status !== "APPROVED") {
    throw new AppError(409, `Only approved employers can be ${action}`);
  }

  return employer;
}

// Suspend/reactivate an approved employer. Suspending also revokes the
// employer's own sessions; access for their employees is blocked separately
// in authenticate/login/refresh.
export async function setEmployerSuspended(id: string, isActive: boolean): Promise<PublicUser> {
  await findApprovedEmployerOrThrow(id, isActive ? "reactivated" : "suspended");

  if (!isActive) {
    await revokeAllRefreshTokens(id);
  }

  const employer = await prisma.user.update({
    where: { id },
    data: { isActive },
  });

  return toPublicUser(employer);
}

// Employees of a suspended employer must be locked out as well, even if their
// own account is active.
async function assertEmployerNotSuspended(
  user: Pick<User, "role" | "employerId">,
): Promise<void> {
  if (user.role !== "EMPLOYEE" || !user.employerId) {
    return;
  }

  const employer = await prisma.user.findUnique({
    where: { id: user.employerId },
    select: { isActive: true },
  });

  if (employer && !employer.isActive) {
    throw new AppError(403, "Your employer account is suspended");
  }
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

  await assertEmployerNotSuspended(user);

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

  await assertEmployerNotSuspended(user);

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

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Case-insensitive match against name, email and company; used by every
// admin list endpoint that accepts a search term.
function buildNameEmailCompanyFilter(search: string): Prisma.UserWhereInput[] {
  return [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { company: { contains: search, mode: "insensitive" } },
  ];
}

export async function listEmployers(query: EmployerStatusQuery): Promise<Paginated<PublicUser>> {
  const where: Prisma.UserWhereInput = {
    role: "EMPLOYER",
    status: query.status,
    OR: query.search ? buildNameEmailCompanyFilter(query.search) : undefined,
  };

  const [total, employers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: employers.map(toPublicUser),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export type EmployerDetails = Omit<User, "passwordHash"> & {
  employeesCount: number;
  lastActivityAt: string | null;
};

export async function getEmployerDetails(id: string): Promise<EmployerDetails> {
  const employer = await findEmployerOrThrow(id);

  const [employeesCount, lastAttendance] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", employerId: employer.id } }),
    // Most recent attendance record among this employer's employees, used as
    // "last activity" for the admin dashboard.
    prisma.attendance.findFirst({
      where: { user: { role: "EMPLOYEE", employerId: employer.id } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const { passwordHash: _passwordHash, ...profile } = employer;

  return {
    ...profile,
    employeesCount,
    lastActivityAt: lastAttendance ? lastAttendance.createdAt.toISOString() : null,
  };
}

export async function listEmployerEmployees(
  id: string,
  query: EmployerEmployeesQuery,
): Promise<Paginated<PublicUser>> {
  await findEmployerOrThrow(id);

  const where: Prisma.UserWhereInput = {
    role: "EMPLOYEE",
    employerId: id,
    OR: query.search
      ? [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [total, employees] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: employees.map(toPublicUser),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
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

export type EmployerDepartments = {
  departments: string[];
  unassigned: boolean;
};

// Distinct non-empty department values of THIS employer's employees, sorted
// alphabetically. `unassigned` reports whether any employee has no department
// so the UI can offer the matching "Unassigned" filter option.
export async function listEmployerDepartments(employerId: string): Promise<EmployerDepartments> {
  const [rows, unassigned] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", employerId, department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
    prisma.user.count({ where: { role: "EMPLOYEE", employerId, department: null } }),
  ]);

  return {
    departments: rows.map((row) => row.department).filter((d): d is string => !!d),
    unassigned: unassigned > 0,
  };
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
