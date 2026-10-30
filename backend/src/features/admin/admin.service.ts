import type { Prisma, User } from "@prisma/client";
import type { AccountStatus, Role } from "@prisma/client";
import { prisma } from "../../shared/lib/prisma";
import { AppError } from "../../shared/utils/app-error";
import {
  instantToISO,
  isoAddDays,
  isoToUtcMidnight,
  todayISO,
  utcDateToISO,
} from "../../shared/utils/date";
import type {
  EmployerEmployeesQuery,
  EmployerStatusQuery,
  RejectEmployerInput,
  UserListQuery,
} from "./admin.schema";

export type PublicUser = Omit<User, "passwordHash">;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Case-insensitive match against name, email and company; used by every
// admin list endpoint that accepts a search term.
function buildNameEmailCompanyFilter(search: string): Prisma.UserWhereInput[] {
  return [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { company: { contains: search, mode: "insensitive" } },
  ];
}

// Wider search for the admin users list: in addition to name, email, company
// and department it also matches an employee's employer company and employer
// name, so searching for a company finds its employees too.
function buildUserSearchFilter(search: string): Prisma.UserWhereInput[] {
  return [
    ...buildNameEmailCompanyFilter(search),
    { department: { contains: search, mode: "insensitive" } },
    { employer: { is: { name: { contains: search, mode: "insensitive" } } } },
    { employer: { is: { company: { contains: search, mode: "insensitive" } } } },
  ];
}

async function findEmployerOrThrow(id: string) {
  const employer = await prisma.user.findFirst({ where: { id, role: "EMPLOYER" } });

  if (!employer) {
    throw new AppError(404, "Employer not found");
  }

  return employer;
}

async function findApprovedEmployerOrThrow(id: string, action: "suspended" | "reactivated") {
  const employer = await findEmployerOrThrow(id);

  if (employer.status !== "APPROVED") {
    throw new AppError(409, `Only approved employers can be ${action}`);
  }

  return employer;
}

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
  employer: { id: string; name: string; company: string | null } | null;
};

export async function listAllUsers(query: UserListQuery): Promise<Paginated<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    role: query.role,
    status: query.status,
    OR: query.search ? buildUserSearchFilter(query.search) : undefined,
  };

  const orderBy: Prisma.UserOrderByWithRelationInput =
    query.sortBy === "name" ? { name: query.sortOrder } : { createdAt: query.sortOrder };

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
        employer: { select: { id: true, name: true, company: true } },
      },
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: users.map(({ employer, ...user }) => ({
      ...user,
      employer: employer ?? null,
    })),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export type UserRoleCounts = {
  all: number;
  admin: number;
  employer: number;
  employee: number;
};

export async function listUserRoleCounts(): Promise<UserRoleCounts> {
  const [all, admin, employer, employee] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
  ]);

  return { all, admin, employer, employee };
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
