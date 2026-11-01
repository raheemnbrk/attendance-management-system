import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";

const locale = { locale: enUS };

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "08:05 AM" style 12-hour time, or "—" when the input is missing/invalid. */
export function formatTime12(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "hh:mm a", locale);
}

/** "Fri, Oct 30, 2026" for the greeting header. */
export function formatHeaderDate(value: string | Date): string {
  return format(toDate(value), "EEE, MMM d, yyyy", locale);
}

/** "Thu, Oct 30" for the history list rows. */
export function formatListDay(value: string | Date): string {
  return format(toDate(value), "EEE, MMM d", locale);
}

/** "October 2026" for the month selector title. */
export function formatMonthTitle(value: string | Date): string {
  return format(toDate(value), "MMMM yyyy", locale);
}

/** Calendar day number label used by the calendar grid. */
export function formatDayNumber(value: Date): string {
  return format(value, "d");
}

/** "7h 32m" from a number of minutes; "—" when unknown. */
export function formatWorkedMinutes(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return "—";
  }
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  return `${hours}h ${rest}m`;
}

/** "03:41:12" from an amount of milliseconds (live timer label). */
export function formatElapsedClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function isoDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** First and last calendar day of the month in YYYY-MM-DD (local clock). */
export function monthRange(monthDate: Date): { from: string; to: string } {
  return {
    from: isoDay(startOfMonth(monthDate)),
    to: isoDay(endOfMonth(monthDate)),
  };
}

/** "2026-10" style key of a month. */
export function monthKey(monthDate: Date): string {
  return format(monthDate, "yyyy-MM");
}

export function addMonths(monthDate: Date, amount: number): Date {
  return new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + amount,
    1,
  );
}

/** Sunday-based rows of days covering the whole month (calendar grid). */
export function calendarWeeks(monthDate: Date): Date[][] {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const gridStart = startOfWeek(first, { weekStartsOn: 0 });
  const gridEnd = addDays(gridStart, Math.ceil((last.getTime() - gridStart.getTime()) / (7 * 86_400_000)) * 7 - 1);

  const weeks: Date[][] = [];
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

/** Week header starting on Sunday, as in the calendar grid. */
export function weekdayHeaders(): string[] {
  const sunday = startOfWeek(new Date(), { weekStartsOn: 0 });
  return eachDayOfInterval({ start: sunday, end: addDays(sunday, 6) }).map((day) =>
    format(day, "EEEEE", locale),
  );
}
