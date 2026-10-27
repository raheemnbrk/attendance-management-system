import { env } from "../config/env";

// Single source of truth for calendar-day logic. "Today" and date boundaries
// are always computed in the configured timezone (env.TZ).

// YYYY-MM-DD date formatter; en-CA locale produces ISO-like output.
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: env.TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Today's date (YYYY-MM-DD) in the configured timezone.
export function todayISO(): string {
  return dateFormatter.format(new Date());
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

// Weekday numbers (0 = Sunday ... 6 = Saturday) configured as weekend days.
const weekendDayNumbers = env.WEEKEND_DAYS.split(",").map(Number);

// True if the calendar day falls on a configured weekend day. A calendar
// date's weekday is timezone-independent, so the lookup works on UTC midnight.
export function isWeekendDay(isoDate: string): boolean {
  return weekendDayNumbers.includes(isoToUtcMidnight(isoDate).getUTCDay());
}

// YYYY-MM-DD shifted by a number of days.
export function isoAddDays(isoDate: string, days: number): string {
  const date = isoToUtcMidnight(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToISO(date);
}

// Every calendar day from fromIso to toIso (inclusive of both bounds),
// excluding the configured weekend days. fromIso must be <= toIso.
export function listWorkingDays(fromIso: string, toIso: string): string[] {
  const workingDays: string[] = [];
  for (let day = fromIso; day <= toIso; day = isoAddDays(day, 1)) {
    if (!isWeekendDay(day)) {
      workingDays.push(day);
    }
  }
  return workingDays;
}
