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
