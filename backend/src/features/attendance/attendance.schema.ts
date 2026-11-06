import { z } from "zod";

// The scanned value of the QR shown at the entrance (a signed JWT). Required
// for both check-in and check-out.
export const qrTokenSchema = z
  .string()
  .trim()
  .min(1, "QR code is required");

export const checkInSchema = z.object({
  qrToken: qrTokenSchema,
  latitude: z
    .number({ message: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number({ message: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
});

export const checkOutSchema = z.object({
  qrToken: qrTokenSchema,
});

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Date is not a valid calendar date",
  });

const pageSchema = z.coerce.number().int().min(1, "Page must be at least 1").default(1);
const limitSchema = z.coerce
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(100, "Limit must be at most 100")
  .default(10);

export const historyQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    page: pageSchema,
    limit: limitSchema,
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

// Sentinel the frontend sends when the "Unassigned" department filter option
// is picked: it must survive the "non-empty string" validation so it can be
// translated into a "department is NULL or empty" database filter.
export const UNASSIGNED_DEPARTMENT = "__none__";

const departmentFilterSchema = z
  .string()
  .trim()
  .min(1, "Department must not be empty")
  .max(100, "Department must be at most 100 characters")
  .optional();

const searchFilterSchema = z
  .string()
  .trim()
  .min(1, "Search must not be empty")
  .max(100, "Search must be at most 100 characters")
  .optional();

export const employeeListQuerySchema = historyQuerySchema.extend({
  date: isoDateSchema.optional(),
  employeeId: z.string().trim().min(1, "Employee id must not be empty").optional(),
  department: departmentFilterSchema,
  search: searchFilterSchema,
});

export const summaryQuerySchema = z.object({
  date: isoDateSchema.optional(),
});

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
  .refine((value) => {
    const month = Number(value.slice(5, 7));
    return month >= 1 && month <= 12;
  }, { message: "Month must be a valid calendar month" });

// Own monthly summary: month defaults to the current one.
export const mySummaryQuerySchema = z.object({
  month: monthSchema.optional(),
});

// Longest allowed monthly report window (matches the export limit).
export const MAX_REPORT_RANGE_DAYS = 366;

function rangeDayCount(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);
  return (toMs - fromMs) / 86_400_000 + 1;
}

// The monthly report filters, shared by the report and its export: either a
// single month (YYYY-MM, current behaviour) or an explicit inclusive date
// range (from/to). A month cannot be combined with from/to.
type MonthlyReportFilterShape = {
  month: z.ZodOptional<typeof monthSchema>;
  from: z.ZodOptional<typeof isoDateSchema>;
  to: z.ZodOptional<typeof isoDateSchema>;
};

const monthlyReportFilterBaseSchema: z.ZodObject<MonthlyReportFilterShape> = z.object({
  month: monthSchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});

function withMonthlyReportRules<TSchema extends z.ZodObject<MonthlyReportFilterShape>>(
  schema: TSchema,
) {
  return schema
    .refine((data) => Boolean(data.month || data.from || data.to), {
      message: "month or from and to are required",
      path: ["month"],
    })
    .refine((data) => !data.month || (!data.from && !data.to), {
      message: "month cannot be combined with from and to",
      path: ["month"],
    })
    .refine((data) => !data.from || !data.to || data.from <= data.to, {
      message: "from must be before or equal to to",
      path: ["from"],
    })
    .refine(
      (data) =>
        !data.from ||
        !data.to ||
        rangeDayCount(data.from, data.to) <= MAX_REPORT_RANGE_DAYS,
      {
        message: `Date range must be at most ${MAX_REPORT_RANGE_DAYS} days`,
        path: ["to"],
      },
    );
}

export const monthlyReportQuerySchema = withMonthlyReportRules(monthlyReportFilterBaseSchema);

export const employeeReportQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export const trendQuerySchema = z.object({
  days: z.coerce
    .number()
    .int("days must be an integer")
    .refine((value) => value === 7 || value === 30, {
      message: "days must be 7 or 30",
    })
    .default(7),
});

export const exportFormatSchema = z.enum(["csv", "xlsx"]);

export const attendanceExportQuerySchema = z
  .object({
    format: exportFormatSchema.default("csv"),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    employeeId: z.string().trim().min(1, "Employee id must not be empty").optional(),
    department: departmentFilterSchema,
    search: searchFilterSchema,
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export const monthlyReportExportQuerySchema = withMonthlyReportRules(
  monthlyReportFilterBaseSchema.extend({
    format: exportFormatSchema.default("csv"),
  }),
);

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type EmployeeHistoryQuery = z.infer<typeof historyQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type MySummaryQuery = z.infer<typeof mySummaryQuerySchema>;
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
export type EmployeeReportQuery = z.infer<typeof employeeReportQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type AttendanceExportQuery = z.infer<typeof attendanceExportQuerySchema>;
export type MonthlyReportExportQuery = z.infer<typeof monthlyReportExportQuerySchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
