import { env } from "./env";

// Single source of truth for business-time decisions. Every "which day / what
// time is it" judgement in the app must go through these exports, in the
// business timezone — never the machine's local clock or timezone.

/** Business timezone; every day/hour reading is taken in this timezone. */
export const BUSINESS_TIMEZONE = env.TZ;

/**
 * Rest days as weekday numbers using JS getDay() semantics
 * (0 = Sunday ... 6 = Saturday). Default: Friday (5) and Saturday (6).
 * Configured through WEEKEND_DAYS, e.g. "5,6".
 */
export const REST_DAYS: readonly number[] = env.WEEKEND_DAYS.split(",").map(Number);

/** Earliest local clock time at which check-in is allowed, business time. */
export const WORK_START = "08:00";

const [workStartHour, workStartMinute] = WORK_START.split(":").map(Number);

/** WORK_START expressed as minutes after local midnight (480 for 08:00). */
export const WORK_START_MINUTES = workStartHour * 60 + workStartMinute;

/**
 * The current instant used by every attendance decision. A Date is an absolute
 * instant and timezone-agnostic; all day/hour readings must go through the
 * business-time helpers below or `shared/utils/date.ts`. Kept as its own
 * function so tests can stub "now" without touching the clock.
 */
export function getNowInAlgiers(): Date {
  return new Date();
}

// "HH:mm" local clock reading in the business timezone.
const businessClockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Local clock of the given instant in the business timezone, as minutes after midnight. */
export function clockMinutesInBusiness(date: Date): number {
  const [hour, minute] = businessClockFormatter.format(date).split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * True when the calendar day is a rest day. Accepts a YYYY-MM-DD string or an
 * instant (whose business-time calendar day is used). A calendar date's
 * weekday does not depend on the timezone it is read in, so the lookup works
 * on the UTC-midnight canonical form.
 */
export function isRestDay(date: string | Date): boolean {
  const isoDate =
    typeof date === "string"
      ? date
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: BUSINESS_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
  return REST_DAYS.includes(new Date(`${isoDate}T00:00:00.000Z`).getUTCDay());
}

/** True when check-in is open at the given instant, in business time and only
 * for non-rest days. Split from the throwing guards so tests can probe it. */
export function isCheckInOpenAt(date: Date): boolean {
  return !isRestDay(date) && clockMinutesInBusiness(date) >= WORK_START_MINUTES;
}
