import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("A valid email address is required"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerEmployerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  company: z.string().trim().min(1, "Company must not be empty").max(100, "Company must be at most 100 characters").optional(),
});

const pageSchema = z.coerce.number().int().min(1, "Page must be at least 1").default(1);
const limitSchema = z.coerce
  .number()
  .int()
  .min(1, "Limit must be at least 1")
  .max(100, "Limit must be at most 100")
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
  limit: limitSchema,
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

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  email: emailSchema,
  department: z.string().trim().min(1, "Department must not be empty").max(100, "Department must be at most 100 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().min(1, "Search must not be empty").max(100, "Search must be at most 100 characters").optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
    department: z.string().trim().min(1, "Department must not be empty").max(100, "Department must be at most 100 characters").optional(),
  })
  .refine((data) => data.name !== undefined || data.department !== undefined, {
    message: "At least one field is required",
  });

export const resetEmployeePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
    company: z.string().trim().min(1, "Company must not be empty").max(100, "Company must be at most 100 characters").optional(),
  })
  .refine((data) => data.name !== undefined || data.company !== undefined, {
    message: "At least one field is required",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
  });

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const refreshSchema = refreshTokenSchema;
export const logoutSchema = refreshTokenSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;
export type EmployerStatusQuery = z.infer<typeof employerStatusQuerySchema>;
export type EmployerEmployeesQuery = z.infer<typeof employerEmployeesQuerySchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type RejectEmployerInput = z.infer<typeof rejectEmployerSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ResetEmployeePasswordInput = z.infer<typeof resetEmployeePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
