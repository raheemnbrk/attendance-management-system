import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/utils/app-error";
import { assertCheckInAllowed, assertCheckOutAllowed } from "./attendance.rules";

// Fixed dates, expressed as instants with an explicit business (Algiers,
// UTC+1) clock so the assertions never depend on the machine's timezone:
//   Sun 2025-01-05, Mon 06, Tue 07, Wed 08, Thu 09, Fri 10, Sat 11.
// Algiers keeps UTC+1 all year, so "+01:00" is the business local time.
const at = (localDateTime: string) => new Date(`${localDateTime}+01:00`);

function expectRejected(action: () => void, message: string, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    const appError = error as AppError;
    expect(appError.message).toBe(message);
    expect(appError.code).toBe(code);
    return;
  }
  throw new Error(`Expected the action to be rejected with ${code}`);
}

function expectAllowed(action: () => void): void {
  expect(action).not.toThrow();
}

describe("check-in time rule", () => {
  it("rejects 07:59 with TOO_EARLY", () => {
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-09T07:59:00")),
      "Check-in opens at 8:00 AM.",
      "TOO_EARLY",
    );
  });

  it("accepts 08:00", () => {
    expectAllowed(() => assertCheckInAllowed(at("2025-01-09T08:00:00")));
  });

  it("accepts 08:00 even through the second border (07:59:59 is not a business minute)", () => {
    expectAllowed(() => assertCheckInAllowed(at("2025-01-09T08:00:59")));
  });

  it("rejects 07:30 on a working day", () => {
    expectAllowed(() => assertCheckOutAllowed(at("2025-01-09T07:30:00")));
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-09T07:30:00")),
      "Check-in opens at 8:00 AM.",
      "TOO_EARLY",
    );
  });
});

describe("check-in rest-day rule", () => {
  it("rejects Friday whatever the clock, even after 08:00", () => {
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-10T08:00:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-10T14:30:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
  });

  it("rejects Saturday whatever the clock", () => {
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-11T08:00:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-11T10:00:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
  });

  it("rejects Friday before 08:00 with REST_DAY first, not TOO_EARLY", () => {
    expectRejected(
      () => assertCheckInAllowed(at("2025-01-10T07:59:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
  });

  it("never rejects working days (Sunday to Thursday) on their own", () => {
    for (const day of ["05", "06", "07", "08", "09"]) {
      expect(
        () => assertCheckInAllowed(at(`2025-01-${day}T09:00:00`)),
        `2025-01-${day} should be workable`,
      ).not.toThrow();
    }
  });
});

describe("check-out rest-day rule", () => {
  it("rejects check-out on Friday and Saturday", () => {
    expectRejected(
      () => assertCheckOutAllowed(at("2025-01-10T18:00:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
    expectRejected(
      () => assertCheckOutAllowed(at("2025-01-11T18:00:00")),
      "Today is a rest day.",
      "REST_DAY",
    );
  });

  it("is not bound by the 08:00 opening time", () => {
    expectAllowed(() => assertCheckOutAllowed(at("2025-01-09T06:45:00")));
  });
});
