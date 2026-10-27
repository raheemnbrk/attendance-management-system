import { Prisma, User } from "@prisma/client";
import { prisma } from "../../shared/lib/prisma";
import { AppError } from "../../shared/utils/app-error";
import { isoToUtcMidnight, todayISO, utcDateToISO } from "../../shared/utils/date";
import type {
  CheckInInput,
  EmployeeListQuery,
  HistoryQuery,
  SummaryQuery,
} from "./attendance.schema";

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

async function findOwnedEmployeeOrThrow(employerId: string, employeeId: string): Promise<User> {
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, role: "EMPLOYEE", employerId },
  });

  if (!employee) {
    throw new AppError(404, "Employee not found");
  }

  return employee;
}

export async function listEmployerAttendance(
  employerId: string,
  query: EmployeeListQuery,
): Promise<PaginatedEmployeeAttendance> {
  const where: Prisma.AttendanceWhereInput = {
    user: {
      employerId,
      role: "EMPLOYEE",
      ...(query.employeeId ? { id: query.employeeId } : {}),
    },
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
