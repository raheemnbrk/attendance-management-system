import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  SEED_ADMIN_EMAIL: z.email("SEED_ADMIN_EMAIL must be a valid email"),
  SEED_ADMIN_PASSWORD: z.string().min(8, "SEED_ADMIN_PASSWORD must be at least 8 characters"),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_ATTENDANCE_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_EMPLOYER_WRITE_MAX: z.coerce.number().int().positive().default(30),
  // Comma-separated weekday numbers, 0 = Sunday ... 6 = Saturday ("5,6" = Friday + Saturday).
  WEEKEND_DAYS: z
    .string()
    .regex(/^(?:[0-6])(?:,[0-6])*$/, "WEEKEND_DAYS must be comma-separated weekday numbers 0-6 (0 = Sunday)")
    .default("5,6"),
  TZ: z.string().default("Africa/Algiers"),
}).refine((data) => {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: data.TZ });
    return true;
  } catch {
    return false;
  }
}, {
  message: "TZ must be a valid IANA timezone name",
  path: ["TZ"],
});
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment variables:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
