"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAttendanceSummary,
  getEmployeeReport,
  getTrend,
  listEmployerAttendance,
} from "./attendance.service";
import type { ListAttendanceQuery } from "./attendance.service";

export function useAttendanceSummary() {
  return useQuery({ queryKey: ["attendance", "summary"], queryFn: getAttendanceSummary });
}

export function useTrend(days: number) {
  return useQuery({ queryKey: ["attendance", "trend", days], queryFn: () => getTrend(days) });
}

export function useEmployerAttendance(query: ListAttendanceQuery) {
  return useQuery({
    queryKey: [
      "attendance",
      "list",
      query.page ?? 1,
      query.limit ?? 10,
      query.date ?? null,
      query.from ?? null,
      query.to ?? null,
      query.employeeId ?? null,
    ],
    queryFn: () => listEmployerAttendance(query),
  });
}

export function useEmployeeReport(employeeId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["attendance", "employee-report", employeeId, from ?? null, to ?? null],
    queryFn: () => getEmployeeReport(employeeId, from, to),
    enabled: employeeId.length > 0,
  });
}
