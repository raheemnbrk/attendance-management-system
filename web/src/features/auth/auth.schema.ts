import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("A valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Mirrors the backend registerEmployerSchema; empty company is sent as absent
// (the backend treats an empty-string company as invalid).
export const registerEmployerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  company: z.string().trim().max(100, "Company must be at most 100 characters").optional(),
  email: z.email("A valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;

// Form shape differs from the wire shape: company is optional (empty omitted).
export type RegisterEmployerFormValues = {
  name: string;
  company?: string;
  email: string;
  password: string;
};
