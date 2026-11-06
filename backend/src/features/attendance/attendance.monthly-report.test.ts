import { describe, expect, it } from "vitest";
import { MAX_REPORT_RANGE_DAYS, monthlyReportQuerySchema } from "./attendance.schema";
import { resolveMonthlyReportRange } from "./attendance.service";

// Fixed business clock for the assertions: Friday 2026-11-06 (a rest day,
// but only the date matters here).
const TODAY = "2026-11-06";

describe("resolveMonthlyReportRange", () => {
  it("resolves a whole month and clamps working days at today", () => {
    const range = resolveMonthlyReportRange({ month: "2026-11" }, TODAY);

    expect(range).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
      workingDaysEnd: TODAY,
    });
  });

  it("does not clamp finished months", () => {
    const range = resolveMonthlyReportRange({ month: "2025-01" }, TODAY);

    expect(range).toEqual({
      from: "2025-01-01",
      to: "2025-01-31",
      workingDaysEnd: "2025-01-31",
    });
  });

  it("uses an explicit from/to as given", () => {
    const range = resolveMonthlyReportRange({ from: "2026-02-01", to: "2026-02-15" }, TODAY);

    expect(range).toEqual({
      from: "2026-02-01",
      to: "2026-02-15",
      workingDaysEnd: "2026-02-15",
    });
  });

  it("treats from-only as open-ended, ending today", () => {
    const range = resolveMonthlyReportRange({ from: "2026-02-01" }, TODAY);

    expect(range).toEqual({
      from: "2026-02-01",
      to: TODAY,
      workingDaysEnd: TODAY,
    });
  });

  it("treats a lone end date as a single-day window", () => {
    const range = resolveMonthlyReportRange({ to: "2026-01-20" }, TODAY);

    expect(range).toEqual({
      from: "2026-01-20",
      to: "2026-01-20",
      workingDaysEnd: "2026-01-20",
    });
  });

  it("falls back to today when nothing is set", () => {
    const range = resolveMonthlyReportRange({}, TODAY);

    expect(range).toEqual({ from: TODAY, to: TODAY, workingDaysEnd: TODAY });
  });
});

describe("monthly report query schema", () => {
  it("accepts a month", () => {
    expect(monthlyReportQuerySchema.parse({ month: "2026-11" })).toEqual({ month: "2026-11" });
  });

  it("accepts from/to", () => {
    expect(monthlyReportQuerySchema.parse({ from: "2026-02-01", to: "2026-02-15" })).toEqual({
      from: "2026-02-01",
      to: "2026-02-15",
    });
  });

  it("rejects an empty query", () => {
    expect(monthlyReportQuerySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a month combined with from/to", () => {
    expect(
      monthlyReportQuerySchema.safeParse({ month: "2026-11", from: "2026-02-01" }).success,
    ).toBe(false);
  });

  it("rejects from after to", () => {
    expect(
      monthlyReportQuerySchema.safeParse({ from: "2026-02-15", to: "2026-02-01" }).success,
    ).toBe(false);
  });

  it(`accepts a range of exactly ${MAX_REPORT_RANGE_DAYS} days`, () => {
    // 2025-01-01 .. 2026-01-01 inclusive spans 366 days (2025 is not a leap year).
    expect(monthlyReportQuerySchema.safeParse({ from: "2025-01-01", to: "2026-01-01" }).success).toBe(
      true,
    );
  });

  it(`rejects a range longer than ${MAX_REPORT_RANGE_DAYS} days`, () => {
    expect(
      monthlyReportQuerySchema.safeParse({ from: "2025-01-01", to: "2026-01-02" }).success,
    ).toBe(false);
  });
});
