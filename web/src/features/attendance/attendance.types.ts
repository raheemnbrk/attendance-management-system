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
export type AttendanceStatus = "present" | "forgot-check-out" | "working" | "absent" | "inactive";

export function getAttendanceStatus(
  employee: Pick<AuthUser, "isActive">,
  record: Pick<AttendanceRecord, "date" | "checkOut"> | undefined,
  today: string,
): AttendanceStatus {
  if (!employee.isActive) {
    return "inactive";
  }

  if (!record) {
    return "absent";
  }

  if (record.checkOut) {
    return "present";
  }

  return record.date < today ? "forgot-check-out" : "working";
}
