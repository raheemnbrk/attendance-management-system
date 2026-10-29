import { Prisma, User } from "@prisma/client";
import { prisma } from "../../shared/lib/prisma";
import { AppError } from "../../shared/utils/app-error";
import {
  isoAddDays,
  isoToUtcMidnight,
  listWorkingDays,
  todayISO,
  utcDateToISO,
} from "../../shared/utils/date";
import type {
  CheckInInput,
  EmployeeListQuery,
  EmployeeReportQuery,
  HistoryQuery,
  SummaryQuery,
} from "./attendance.schema";
import { UNASSIGNED_DEPARTMENT } from "./attendance.schema";

type AttendanceGetPayload = Prisma.AttendanceGetPayload<object>;

export type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  latitude: number | null;
  longitude: number | null;
  workedMinutes?: number;
};

export function mapAttendance(record: Prisma.AttendanceGetPayload<object>): AttendanceRecord {
  return {
    id: record.id,
    userId: record.userId,
    date: utcDateToISO(record.date),
    checkIn: record.checkIn.toISOString(),
    checkOut: record.checkOut ? record.checkOut.toISOString() : null,
    latitude: record.latitude,
    longitude: record.longitude,
    ...(record.checkOut
      ? {
          workedMinutes: Math.round(
            (record.checkOut.getTime() - record.checkIn.getTime()) / 60_000,
          ),
        }
      : {}),
  };
}

export async function checkIn(userId: string, input: CheckInInput): Promise<AttendanceRecord> {
  const date = isoToUtcMidnight(todayISO());

  try {
    const record = await prisma.attendance.create({
      data: {
        userId,
        date,
        checkIn: new Date(),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    });

    return mapAttendance(record);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "Already checked in today");
    }
    throw error;
  }
}

export async function checkOut(userId: string): Promise<AttendanceRecord> {
  const date = isoToUtcMidnight(todayISO());
  const record = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!record) {
    throw new AppError(404, "No check-in found for today");
  }

  if (record.checkOut) {
    throw new AppError(409, "Already checked out today");
  }

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { checkOut: new Date() },
  });

  return mapAttendance(updated);
}

export async function getToday(userId: string): Promise<AttendanceRecord | null> {
  const date = isoToUtcMidnight(todayISO());
  const record = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date } },
  });

  return record ? mapAttendance(record) : null;
}

function buildDateRangeFilter(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  return {
    gte: from ? isoToUtcMidnight(from) : undefined,
    lte: to ? isoToUtcMidnight(to) : undefined,
  };
}

type PaginatedAttendance = {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listMyAttendance(
  userId: string,
  query: HistoryQuery,
): Promise<PaginatedAttendance> {
  const where: Prisma.AttendanceWhereInput = {
    userId,
    date: buildDateRangeFilter(query.from, query.to),
  };

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: records.map(mapAttendance),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export type EmployeeAttendanceRecord = AttendanceRecord & {
  employee: Omit<User, "passwordHash">;
};

type PaginatedEmployeeAttendance = {
  items: EmployeeAttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapAttendanceWithEmployee(
  record: Prisma.AttendanceGetPayload<{ include: { user: true } }>,
): EmployeeAttendanceRecord {
  const { passwordHash: _passwordHash, ...employee } = record.user;
  return {
    ...mapAttendance(record),
    employee,
  };
}

export async function findOwnedEmployeeOrThrow(employerId: string, employeeId: string): Promise<User> {
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, role: "EMPLOYEE", employerId },
  });

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return employee;
}

// Shared user-level filter for the employer's attendance list and export:
// department (`__none__` = no department set) and search by name or email.
// The side conditions are combined with AND so both filters can apply at once.
type UserFilterInput = {
  employeeId?: string;
  department?: string;
  search?: string;
};

export function buildEmployerUserFilter(
  employerId: string,
  query: UserFilterInput,
): Prisma.UserWhereInput {
  const conditions: Prisma.UserWhereInput[] = [];

  if (query.department) {
    conditions.push(
      query.department === UNASSIGNED_DEPARTMENT
        ? { OR: [{ department: null }, { department: "" }] }
        : { department: query.department },
    );
  }

  if (query.search) {
    conditions.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  const base: Prisma.UserWhereInput = {
    employerId,
    role: "EMPLOYEE" as const,
    ...(query.employeeId ? { id: query.employeeId } : {}),
  };

  if (conditions.length === 0) {
    return base;
  }

  if (conditions.length === 1) {
    return { ...base, ...conditions[0] };
  }

  return { ...base, AND: conditions };
}

export async function listEmployerAttendance(
  employerId: string,
  query: EmployeeListQuery,
): Promise<PaginatedEmployeeAttendance> {
  const where: Prisma.AttendanceWhereInput = {
    user: buildEmployerUserFilter(employerId, query),
    ...(query.date
      ? { date: isoToUtcMidnight(query.date) }
      : { date: buildDateRangeFilter(query.from, query.to) }),
  };

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: { user: true },
      orderBy: [{ date: "desc" }, { checkIn: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: records.map(mapAttendanceWithEmployee),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getEmployerEmployeeAttendance(
  employerId: string,
  employeeId: string,
  query: HistoryQuery,
): Promise<PaginatedEmployeeAttendance> {
  await findOwnedEmployeeOrThrow(employerId, employeeId);

  const where: Prisma.AttendanceWhereInput = {
    userId: employeeId,
    date: buildDateRangeFilter(query.from, query.to),
  };

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: { user: true },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: records.map(mapAttendanceWithEmployee),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getAttendanceSummary(employerId: string, query: SummaryQuery) {
  const date = isoToUtcMidnight(query.date ?? todayISO());
  const employeeFilter = { employerId, role: "EMPLOYEE" as const, isActive: true };

  const [totalEmployees, present, checkedOut] = await Promise.all([
    prisma.user.count({ where: employeeFilter }),
    prisma.attendance.count({ where: { date, user: employeeFilter } }),
    prisma.attendance.count({ where: { date, checkOut: { not: null }, user: employeeFilter } }),
  ]);

  return {
    date: utcDateToISO(date),
    totalEmployees,
    present,
    absent: totalEmployees - present,
    checkedOut,
  };
}

// ---------------------------------------------------------------------------
// Reports (employer only)
// ---------------------------------------------------------------------------

// Last calendar day of a YYYY-MM month as YYYY-MM-DD.
function monthLastDay(month: string): string {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

type AttendanceTotals = {
  daysPresent: number;
  totalMinutes: number;
  forgottenCheckOuts: number;
};

// Aggregates raw records over a set of working days. Presence on weekend days
// does not count; totalMinutes comes only from records with a check-out, and a
// past record without check-out counts as forgotten.
function computeAttendanceTotals(
  records: AttendanceGetPayload[],
  workingDaySet: Set<string>,
  today: string,
): AttendanceTotals {
  let daysPresent = 0;
  let totalMinutes = 0;
  let forgottenCheckOuts = 0;

  for (const record of records) {
    const date = utcDateToISO(record.date);

    if (workingDaySet.has(date)) {
      daysPresent += 1;
    }

    if (record.checkOut) {
      totalMinutes += Math.round((record.checkOut.getTime() - record.checkIn.getTime()) / 60_000);
    } else if (date < today) {
      forgottenCheckOuts += 1;
    }
  }

  return { daysPresent, totalMinutes, forgottenCheckOuts };
}

export type MonthlyReportRow = {
  employeeId: string;
  name: string;
  department: string | null;
  daysPresent: number;
  daysAbsent: number;
  totalMinutes: number;
  averageMinutesPerDay: number;
  forgottenCheckOuts: number;
};

export async function getMonthlyReport(
  employerId: string,
  month: string,
): Promise<MonthlyReportRow[]> {
  const today = todayISO();
  const monthStart = `${month}-01`;
  const monthEnd = monthLastDay(month);
  // Count working days only up to today so future days are not counted as absences.
  const rangeEnd = monthEnd < today ? monthEnd : today;
  const workingDays = monthStart <= rangeEnd ? listWorkingDays(monthStart, rangeEnd) : [];

  const [employees, records] = await Promise.all([
    prisma.user.findMany({
      where: { employerId, role: "EMPLOYEE" as const, isActive: true },
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        user: { employerId, role: "EMPLOYEE" as const },
        date: { gte: isoToUtcMidnight(monthStart), lte: isoToUtcMidnight(monthEnd) },
      },
    }),
  ]);

  const recordsByEmployee = new Map<string, AttendanceGetPayload[]>();
  for (const record of records) {
    const list = recordsByEmployee.get(record.userId) ?? [];
    list.push(record);
    recordsByEmployee.set(record.userId, list);
  }

  return employees.map((employee) => {
    const totals = computeAttendanceTotals(
      recordsByEmployee.get(employee.id) ?? [],
      new Set(workingDays),
      today,
    );

    return {
      employeeId: employee.id,
      name: employee.name,
      department: employee.department ?? null,
      daysPresent: totals.daysPresent,
      daysAbsent: Math.max(0, workingDays.length - totals.daysPresent),
      totalMinutes: totals.totalMinutes,
      averageMinutesPerDay: totals.daysPresent
        ? Math.round(totals.totalMinutes / totals.daysPresent)
        : 0,
      forgottenCheckOuts: totals.forgottenCheckOuts,
    };
  });
}

export type EmployeeReport = {
  employeeId: string;
  name: string;
  department: string | null;
  from: string;
  to: string;
  workingDays: number;
  daysPresent: number;
  daysAbsent: number;
  totalMinutes: number;
  averageMinutesPerDay: number;
  forgottenCheckOuts: number;
  records: AttendanceRecord[];
};

export async function getEmployeeReport(
  employerId: string,
  employeeId: string,
  query: EmployeeReportQuery,
): Promise<EmployeeReport> {
  const employee = await findOwnedEmployeeOrThrow(employerId, employeeId);

  const today = todayISO();
  // Defaults: a rolling window ending today (`to`), starting 30 days back (`from`).
  const to = query.to ?? today;
  const from = query.from ?? (isoAddDays(to, -29) < to ? isoAddDays(to, -29) : to);
  const workingEnd = to < today ? to : today;
  const workingDays = from <= workingEnd ? listWorkingDays(from, workingEnd) : [];

  const records = await prisma.attendance.findMany({
    where: {
      userId: employeeId,
      date: { gte: isoToUtcMidnight(from), lte: isoToUtcMidnight(to) },
    },
    orderBy: { date: "desc" },
  });

  const totals = computeAttendanceTotals(records, new Set(workingDays), today);

  return {
    employeeId: employee.id,
    name: employee.name,
    department: employee.department ?? null,
    from,
    to,
    workingDays: workingDays.length,
    daysPresent: totals.daysPresent,
    daysAbsent: Math.max(0, workingDays.length - totals.daysPresent),
    totalMinutes: totals.totalMinutes,
    averageMinutesPerDay: totals.daysPresent
      ? Math.round(totals.totalMinutes / totals.daysPresent)
      : 0,
    forgottenCheckOuts: totals.forgottenCheckOuts,
    records: records.map(mapAttendance),
  };
}

export type TrendDay = {
  date: string;
  present: number;
  absent: number;
};

export async function getTrend(employerId: string, days: number): Promise<TrendDay[]> {
  const today = todayISO();
  // Rolling window ending today, inclusive of both ends.
  const from = isoAddDays(today, -(days - 1));
  const employeeFilter = { employerId, role: "EMPLOYEE" as const, isActive: true };

  const [totalEmployees, presentCounts] = await Promise.all([
    prisma.user.count({ where: employeeFilter }),
    prisma.attendance.groupBy({
      by: ["date"],
      where: {
        user: employeeFilter,
        date: { gte: isoToUtcMidnight(from), lte: isoToUtcMidnight(today) },
      },
      _count: { _all: true },
    }),
  ]);

  const presentByDate = new Map<string, number>();
  for (const entry of presentCounts) {
    presentByDate.set(utcDateToISO(entry.date), entry._count._all);
  }

  const trend: TrendDay[] = [];
  for (let day = from; day <= today; day = isoAddDays(day, 1)) {
    const present = presentByDate.get(day) ?? 0;
    trend.push({ date: day, present, absent: totalEmployees - present });
  }

  return trend;
}
