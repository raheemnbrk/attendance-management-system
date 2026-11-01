import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid email address",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginValues = z.infer<typeof loginFormSchema>;

const passwordField = z.string().min(8, "New password must be at least 8 characters");

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordFormSchema>;
