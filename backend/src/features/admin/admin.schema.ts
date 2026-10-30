import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1, "Page must be at least 1").default(1);
const limitSchema = z.coerce
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(100, "Limit must be at most 100")
  .default(10);
const userLimitSchema = z.coerce
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(50, "Limit must be at most 50")
  .default(10);

const searchSchema = z
  .string()
  .trim()
  .min(1, "Search must not be empty")
  .max(100, "Search must be at most 100 characters")
  .optional();

export const employerStatusQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  search: searchSchema,
  page: pageSchema,
  limit: limitSchema,
});

export const employerEmployeesQuerySchema = z.object({
  search: searchSchema,
  page: pageSchema,
  limit: limitSchema,
});

export const userListQuerySchema = z.object({
  search: searchSchema,
  role: z.enum(["ADMIN", "EMPLOYER", "EMPLOYEE"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: pageSchema,
  limit: userLimitSchema,
  sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const trendsQuerySchema = z.object({
  days: z.coerce
    .number()
    .int("days must be an integer")
    .refine((value) => value === 7 || value === 30, {
      message: "days must be 7 or 30",
    })
    .default(30),
});

export const activityQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(10),
});

export const rejectEmployerSchema = z.object({
  reason: z.string().trim().max(500, "Reason must be at most 500 characters").optional(),
});

export type EmployerStatusQuery = z.infer<typeof employerStatusQuerySchema>;
export type EmployerEmployeesQuery = z.infer<typeof employerEmployeesQuerySchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type RejectEmployerInput = z.infer<typeof rejectEmployerSchema>;
