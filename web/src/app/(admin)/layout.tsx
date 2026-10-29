import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardPath, ROLE_COOKIE_NAME } from "@/shared/lib/dashboard-path";
import { AdminShell } from "@/features/auth/admin-shell";

export const instant = false;

// Server-side role gate (works even without the proxy): an EMPLOYER cookie
// landing on the admin area is bounced to their own dashboard.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = (await cookies()).get(ROLE_COOKIE_NAME)?.value;

  if (role && role !== "ADMIN") {
    redirect(getDashboardPath(role));
  }

  return <AdminShell>{children}</AdminShell>;
}
