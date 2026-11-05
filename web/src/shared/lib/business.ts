// Business time rules mirrored from the backend's shared/config/business.ts.
// The web never computes attendance; this exists only for display decisions
// (e.g. marking the dashboard's Today table on rest days).

/** JS getDay() weekday numbers (0 = Sunday ... 6 = Saturday) treated as rest
 * days. Must match the backend's REST_DAYS (WEEKEND_DAYS, default "5,6"). */
export const REST_DAYS: readonly number[] = [5, 6];

/** True when a YYYY-MM-DD calendar day is a rest day. A calendar date's
 * weekday is timezone-independent, so the lookup works on UTC midnight. */
export function isRestDayISO(isoDate: string): boolean {
  return REST_DAYS.includes(new Date(`${isoDate}T00:00:00.000Z`).getUTCDay());
}
