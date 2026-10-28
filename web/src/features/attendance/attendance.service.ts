import { apiRequest } from "@/shared/lib/api";
import type {
  AttendanceSummary,
  EmployeeAttendanceRecord,
  Paginated,
  TrendDay,
} from "./attendance.types";

export type ListAttendanceQuery = {
  page?: number;
  limit?: number;
  date?: string;
  from?: string;
  to?: string;
  employeeId?: string;
};

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>({ method: "GET", url: "/attendance/summary" });
}

export async function getTrend(days: number): Promise<TrendDay[]> {
  return apiRequest<TrendDay[]>({
    method: "GET",
    url: "/attendance/trend",
    params: { days },
  });
}

export async function listEmployerAttendance(
  query: ListAttendanceQuery,
): Promise<Paginated<EmployeeAttendanceRecord>> {
  return apiRequest<Paginated<EmployeeAttendanceRecord>>({
    method: "GET",
    url: "/attendance/employees",
    params: {
      ...(query.page ? { page: query.page } : {}),
      ...(query.limit ? { limit: query.limit } : {}),
      ...(query.date ? { date: query.date } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    },
  });
}
