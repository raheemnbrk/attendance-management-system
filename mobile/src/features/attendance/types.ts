import type { PaginatedResult } from "@/shared/types";

export type AttendanceRecord = {
  id: string;
  userId: string;
  /** Calendar day in YYYY-MM-DD (server's timezone). */
  date: string;
  checkIn: string;
  checkOut: string | null;
  latitude: number | null;
  longitude: number | null;
  workedMinutes?: number;
};

export type PaginatedAttendance = PaginatedResult<AttendanceRecord>;

export type WeekSummary = {
  from: string;
  to: string;
  daysPresent: number;
  totalMinutes: number;
};

export type MonthSummary = {
  month: string;
  daysPresent: number;
  totalMinutes: number;
  averageMinutesPerDay: number;
  forgottenCheckOuts: number;
};

/** What the today endpoint means for the check-in button. */
export type TodayState = "idle" | "working" | "done";
