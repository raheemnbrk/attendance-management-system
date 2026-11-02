import { apiGet, apiPost } from "@/shared/api/client";
import type { AttendanceRecord, MonthSummary, PaginatedAttendance, WeekSummary } from "./types";

/** The API stamps attendance responses with `serverTime`; we keep it next to
 * the payload so hooks can derive the phone-vs-server clock offset. */
export type ServerStamp<T> = {
  data: T;
  serverTime: number | null;
};

function stamp<T>(payload: { data: T; serverTime?: string }): ServerStamp<T> {
  const parsed = payload.serverTime ? Date.parse(payload.serverTime) : Number.NaN;
  return {
    data: payload.data,
    serverTime: Number.isNaN(parsed) ? null : parsed,
  };
}

export async function fetchToday(): Promise<ServerStamp<AttendanceRecord | null>> {
  const response = await apiGet<AttendanceRecord | null>("/attendance/today");
  return stamp(response);
}

export async function checkInRequest(): Promise<ServerStamp<AttendanceRecord>> {
  // No coordinates: location capture is not part of this app yet.
  const response = await apiPost<AttendanceRecord>("/attendance/check-in", {});
  return stamp(response);
}

export async function checkOutRequest(): Promise<ServerStamp<AttendanceRecord>> {
  const response = await apiPost<AttendanceRecord>("/attendance/check-out");
  return stamp(response);
}

export async function fetchWeekSummary(): Promise<ServerStamp<WeekSummary>> {
  const response = await apiGet<WeekSummary>("/attendance/me/week");
  return stamp(response);
}

export async function fetchMonthSummary(month?: string): Promise<ServerStamp<MonthSummary>> {
  const response = await apiGet<MonthSummary>("/attendance/me/summary", month ? { month } : undefined);
  return stamp(response);
}

/** All records of one month in a single request (never more than 31 rows). */
export async function fetchMonthRecords(month: string): Promise<ServerStamp<PaginatedAttendance>> {
  const response = await apiGet<PaginatedAttendance>("/attendance/me", {
    from: `${month}-01`,
    to: `${month}-31`,
    page: 1,
    limit: 100,
  });
  return stamp(response);
}

export async function fetchHistoryPage(
  month: string,
  page: number,
  limit = 10,
): Promise<ServerStamp<PaginatedAttendance>> {
  const response = await apiGet<PaginatedAttendance>("/attendance/me", {
    from: `${month}-01`,
    to: `${month}-31`,
    page,
    limit,
  });
  return stamp(response);
}
