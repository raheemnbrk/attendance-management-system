"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAttendanceSummary,
  getEmployeeReport,
  getEntryQr,
  getMonthlyReport,
  getTrend,
  listEmployerAttendance,
} from "./attendance.service";
import type { ListAttendanceQuery } from "./attendance.service";

export function useAttendanceSummary() {
  return useQuery({ queryKey: ["attendance", "summary"], queryFn: getAttendanceSummary });
}

/** Tokens for the entrance screen: a fresh one every ~25s while the tab is
 * visible (token lifetime is 30s), paused when hidden and refetched the
 * moment the tab becomes visible again. */
export function useEntryQr() {
  return useQuery({
    queryKey: ["attendance", "entry-qr"],
    queryFn: getEntryQr,
    refetchInterval: 25_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    // The whole dashboard will retry on 401 already; refresh + retry loops must
    // not stack on failures here.
    retry: false,
  });
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
      query.department ?? null,
      query.search ?? null,
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

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ["attendance", "monthly-report", month],
    queryFn: () => getMonthlyReport(month),
  });
}
