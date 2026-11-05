import { BUSINESS_TIMEZONE, REST_DAYS } from "../config/business";

// Single source of truth for calendar-day logic. "Today" and date boundaries
// are always computed in the business timezone
// (shared/config/business.ts → BUSINESS_TIMEZONE).

// YYYY-MM-DD date formatter; en-CA locale produces ISO-like output.
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Today's date (YYYY-MM-DD) in the configured timezone.
export function todayISO(): string {
  return dateFormatter.format(new Date());
}

// YYYY-MM-DD calendar day of any instant, in the configured timezone.
export function instantToISO(date: Date): string {
  return dateFormatter.format(date);
}

// Date + time formatter used by file exports: "YYYY-MM-DD HH:mm" in the
// business timezone (h23 to avoid a "24:xx" hour at midnight).
const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "YYYY-MM-DD HH:mm" representation of an instant in the configured timezone.
export function formatDateTimeTz(date: Date): string {
  const parts = dateTimeFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

// Canonical representation of a calendar day for @db.Date columns: a Date
// instance at UTC midnight of that day (a @db.Date column carries no time).
export function isoToUtcMidnight(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

// YYYY-MM-DD string of a @db.Date value (always stored at UTC midnight).
export function utcDateToISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Weekday numbers (0 = Sunday ... 6 = Saturday) configured as rest days in
// shared/config/business.ts (REST_DAYS, e.g. Friday + Saturday).

// True if the calendar day falls on a configured rest day. A calendar date's
// weekday is timezone-independent, so the lookup works on UTC midnight.
export function isRestDay(isoDate: string): boolean {
  return REST_DAYS.includes(isoToUtcMidnight(isoDate).getUTCDay());
}

// YYYY-MM-DD shifted by a number of days.
export function isoAddDays(isoDate: string, days: number): string {
  const date = isoToUtcMidnight(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToISO(date);
}

// Every calendar day from fromIso to toIso (inclusive of both bounds),
// excluding the configured rest days. fromIso must be <= toIso.
export function listWorkingDays(fromIso: string, toIso: string): string[] {
  const workingDays: string[] = [];
  for (let day = fromIso; day <= toIso; day = isoAddDays(day, 1)) {
    if (!isRestDay(day)) {
      workingDays.push(day);
    }
  }
  return workingDays;
}
