// Business time rules, mirrored from the backend's shared/config/business.ts
// so the UI can pre-empt what the API would reject. The backend stays the
// source of truth: it uses the Africa/Algiers timezone for every decision and
// never trusts the phone's clock.

/** Africa/Algiers stays on UTC+1 all year (no DST), so business time is just
 * "UTC + 1 hour" — no Intl timezone support needed on the device. */
export const ALGIERS_UTC_OFFSET_MS = 60 * 60 * 1000;

/** JS getDay() weekday numbers (0 = Sunday ... 6 = Saturday) treated as rest
 * days by the company: Friday (5) and Saturday (6). Must match the backend's
 * REST_DAYS. */
export const REST_DAYS: readonly number[] = [5, 6];

/** Check-in opens at 08:00 business time (backend: WORK_START). */
export const WORK_START_MINUTES = 8 * 60;

export const REST_DAY_NOTICE = "Today is a rest day.";
export const CHECK_IN_OPEN_NOTICE = "Check-in opens at 8:00 AM";

/** The company clock, evaluated on the server-corrected instant. */
export function algiersClockMinutes(correctedNowMs: number): number {
  const shifted = new Date(correctedNowMs + ALGIERS_UTC_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** Whether "today", measured on the company clock, is a rest day. */
export function isRestDayAt(correctedNowMs: number): boolean {
  return REST_DAYS.includes(new Date(correctedNowMs + ALGIERS_UTC_OFFSET_MS).getUTCDay());
}

/** Why the check-in button is locked right now, or null when it is open. */
export function checkInLockReason(correctedNowMs: number): string | null {
  if (isRestDayAt(correctedNowMs)) {
    return REST_DAY_NOTICE;
  }
  if (algiersClockMinutes(correctedNowMs) < WORK_START_MINUTES) {
    return CHECK_IN_OPEN_NOTICE;
  }
  return null;
}
