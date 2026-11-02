import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string()
    .trim()
    .min(1, "EXPO_PUBLIC_API_URL is required")
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "EXPO_PUBLIC_API_URL must be a valid http(s) URL, e.g. http://192.168.1.19:3000/api" },
    ),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
  const details = [
    "EXPO_PUBLIC_API_URL is missing or invalid:",
    `${issues}.`,
    "Set it in mobile/.env, e.g. EXPO_PUBLIC_API_URL=https://your-backend.example.com/api,",
    "then restart the dev server so the value is re-inlined (a Metro cache restart may be needed).",
    "The app cannot make any API requests until this is fixed.",
  ].join(" ");
  console.error(`[env] ${details}`);
  throw new Error(details);
}

const apiUrl = parsed.data.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");

export const env = {
  apiBaseUrl: apiUrl,
} as const;
