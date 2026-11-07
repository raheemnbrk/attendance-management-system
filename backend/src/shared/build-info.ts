// Build stamp surfaced through /health so the live deployment can be checked
// from anywhere: which commit Render built, which Node it runs on, and whether
// the QR signing key passes the 32-char boot rule (never exposes the value).
import { env } from "./config/env";

export function getBuildInfo() {
  return {
    status: "ok" as const,
    commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev",
    node: process.version,
    qrSecretReady: env.ATTENDANCE_QR_SECRET.length >= 32,
  };
}
