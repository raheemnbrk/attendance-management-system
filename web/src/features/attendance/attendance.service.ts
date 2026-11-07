import { apiRequest } from "@/shared/lib/api";
import { ATTENDANCE_API } from "@/shared/lib/endpoints";
import type {
  AttendanceSummary,
  EmployeeAttendanceRecord,
  EmployeeReport,
  EntryQr,
  MonthlyReportRow,
  Paginated,
  TrendDay,
} from "./attendance.types";

export const UNASSIGNED_DEPARTMENT = "__none__";

export type ListAttendanceQuery = {
  page?: number;
  limit?: number;
  date?: string;
  from?: string;
  to?: string;
  employeeId?: string;
  department?: string;
  search?: string;
};

export async function getEntryQr(): Promise<EntryQr> {
  return apiRequest<EntryQr>({ method: "GET", url: ATTENDANCE_API.entryQr });
}

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>({ method: "GET", url: ATTENDANCE_API.summary });
}

export async function getTrend(days: number): Promise<TrendDay[]> {
  return apiRequest<TrendDay[]>({
    method: "GET",
    url: ATTENDANCE_API.trend,
    params: { days },
  });
}

export async function listEmployerAttendance(
  query: ListAttendanceQuery,
): Promise<Paginated<EmployeeAttendanceRecord>> {
  return apiRequest<Paginated<EmployeeAttendanceRecord>>({
    method: "GET",
    url: ATTENDANCE_API.employerAttendance,
    params: {
      ...(query.page ? { page: query.page } : {}),
      ...(query.limit ? { limit: query.limit } : {}),
      ...(query.date ? { date: query.date } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.department ? { department: query.department } : {}),
      ...(query.search ? { search: query.search } : {}),
    },
  });
}

export async function getEmployeeReport(
  employeeId: string,
  from?: string,
  to?: string,
): Promise<EmployeeReport> {
  return apiRequest<EmployeeReport>({
    method: "GET",
    url: ATTENDANCE_API.employeeReport(employeeId),
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  });
}

export type MonthlyReportQuery = {
  month?: string;
  from?: string;
  to?: string;
};

export async function getMonthlyReport(
  query: MonthlyReportQuery,
): Promise<MonthlyReportRow[]> {
  return apiRequest<MonthlyReportRow[]>({
    method: "GET",
    url: ATTENDANCE_API.monthlyReport,
    params: {
      ...(query.month ? { month: query.month } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
    },
  });
}
