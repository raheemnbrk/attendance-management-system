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

export const employerStatusQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
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

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const refreshSchema = refreshTokenSchema;
export const logoutSchema = refreshTokenSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;
export type EmployerStatusQuery = z.infer<typeof employerStatusQuerySchema>;
export type RejectEmployerInput = z.infer<typeof rejectEmployerSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ResetEmployeePasswordInput = z.infer<typeof resetEmployeePasswordSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
