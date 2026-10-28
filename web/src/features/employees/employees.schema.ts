import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  email: z.email("A valid email address is required"),
  department: z
    .string()
    .trim()
    .max(100, "Department must be at most 100 characters")
    .optional()
    .or(z.literal("")),
});

export const editEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  department: z
    .string()
    .trim()
    .max(100, "Department must be at most 100 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
export type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;
