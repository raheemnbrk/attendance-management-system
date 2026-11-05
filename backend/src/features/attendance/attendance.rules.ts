import {
  clockMinutesInBusiness,
  isRestDay,
  WORK_START_MINUTES,
} from "../../shared/config/business";
import { instantToISO } from "../../shared/utils/date";
import { AppError } from "../../shared/utils/app-error";

export const REST_DAY_MESSAGE = "Today is a rest day.";
export const TOO_EARLY_MESSAGE = "Check-in opens at 8:00 AM.";

/**
 * Whether an employee may check in at the given instant. Decision order, which
 * is also the error order callers receive: rest day, then too early.
 *
 * - Rest days (Friday and Saturday) are never workable, whatever the clock.
 * - Check-in opens at 08:00 business time; earlier clock readings fail even
 *   after a rest day passes, but rest days win so data is never polluted.
 * - The phone's clock is never consulted: callers pass getNowInAlgiers().
 */
export function assertCheckInAllowed(now: Date): void {
  if (isRestDay(instantToISO(now))) {
    throw new AppError(400, REST_DAY_MESSAGE, "REST_DAY");
  }
  if (clockMinutesInBusiness(now) < WORK_START_MINUTES) {
    throw new AppError(400, TOO_EARLY_MESSAGE, "TOO_EARLY");
  }
}

/**
 * Whether an employee may check out at the given instant. Check-out is not
 * bound by the 08:00 rule, only by rest days.
 */
export function assertCheckOutAllowed(now: Date): void {
  if (isRestDay(instantToISO(now))) {
    throw new AppError(400, REST_DAY_MESSAGE, "REST_DAY");
  }
}
