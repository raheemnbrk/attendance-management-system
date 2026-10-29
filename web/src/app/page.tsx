"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/auth.store";
import { getDashboardPath } from "@/shared/lib/dashboard-path";

// The Dashboard button is role-aware: ADMIN -> /admin/dashboard,
// EMPLOYER -> /employer/dashboard, no session (or employee accounts, which use
// the mobile app) -> /login. Resolved on the client because the session lives
// in the zustand store plus localStorage.
export default function Home() {
  const role = useAuthStore((state) => state.user?.role);
  const dashboardHref = getDashboardPath(role);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-16">
      <h1 className="text-3xl font-semibold tracking-tight">Attendance Platform</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-foreground/85"
        >
          Sign in
        </Link>
        <Link
          href={dashboardHref}
          className="rounded-md border border-border px-5 py-2.5 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
