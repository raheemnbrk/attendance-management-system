import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardPath, ROLE_COOKIE_NAME } from "@/shared/lib/dashboard-path";
import { EmployerRoute } from "@/features/auth/employer-route";

export const instant = false;

// Server-side role gate (works even without the proxy): an ADMIN cookie
// landing on the employer area is bounced to their own dashboard.
export default async function EmployerLayout({ children }: { children: ReactNode }) {
  const role = (await cookies()).get(ROLE_COOKIE_NAME)?.value;

  if (role && role !== "EMPLOYER") {
    redirect(getDashboardPath(role));
  }

  return <EmployerRoute>{children}</EmployerRoute>;
}
