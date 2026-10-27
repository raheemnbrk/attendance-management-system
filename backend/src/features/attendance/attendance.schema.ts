import { z } from "zod";

export const checkInSchema = z.object({
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

export const employeeListQuerySchema = historyQuerySchema.extend({
  date: isoDateSchema.optional(),
  employeeId: z.string().trim().min(1, "Employee id must not be empty").optional(),
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

export const monthlyReportQuerySchema = z.object({
  month: monthSchema,
});

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
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export const monthlyReportExportQuerySchema = z.object({
  format: exportFormatSchema.default("csv"),
  month: monthSchema,
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type EmployeeHistoryQuery = z.infer<typeof historyQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
export type EmployeeReportQuery = z.infer<typeof employeeReportQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type AttendanceExportQuery = z.infer<typeof attendanceExportQuerySchema>;
export type MonthlyReportExportQuery = z.infer<typeof monthlyReportExportQuerySchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
