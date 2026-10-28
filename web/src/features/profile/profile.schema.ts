import { z } from "zod";

// Mirrors the backend updateProfileSchema / changePasswordSchema.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  company: z
    .string()
    .trim()
    .min(1, "Company must not be empty")
    .max(100, "Company must be at most 100 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
