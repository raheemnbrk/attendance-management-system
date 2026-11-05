import type { AuthUser } from "@/shared/types/auth";

// Mirror of the backend attendance payloads ({ success, data } envelopes are
// unwrapped by apiRequest).

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

export type EmployeeAttendanceRecord = AttendanceRecord & {
  employee: AuthUser;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AttendanceSummary = {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  checkedOut: number;
};

// Payload of GET /attendance/entry-qr: a short-lived token rendered as the QR
// code shown at the entrance.
export type EntryQr = {
  token: string;
  /** ISO instant at which the token becomes invalid. */
  expiresAt: string;
  /** Token lifetime in seconds (the countdown's full range). */
  ttlSeconds: number;
};

export type TrendDay = {
  date: string;
  present: number;
  absent: number;
};

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

export type ExportFormat = "csv" | "xlsx";

// UI-level attendance status for badges: Present = success, forgot check-out
// on a past day = warning, absent = destructive, inactive = muted.
// "rest" marks the whole table on rest days (never shown as absence).
export type AttendanceStatus = "present" | "forgot-check-out" | "working" | "absent" | "rest" | "inactive";

export function getAttendanceStatus(
  employee: Pick<AuthUser, "isActive">,
  record: Pick<AttendanceRecord, "date" | "checkOut"> | undefined,
  today: string,
  isRestDay = false,
): AttendanceStatus {
  if (!employee.isActive) {
    return "inactive";
  }

  if (!record) {
    return isRestDay ? "rest" : "absent";
  }

  if (record.checkOut) {
    return "present";
  }

  return record.date < today ? "forgot-check-out" : "working";
}
