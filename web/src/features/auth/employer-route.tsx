"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getDashboardPath } from "@/shared/lib/dashboard-path";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useAuthStore } from "./auth.store";

// Employer-only routes: bounces unauthenticated visitors back to /login and
// redirects authenticated non-employers to their OWN dashboard.
export function EmployerRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const wrongRole = status === "authenticated" && user && user.role !== "EMPLOYER";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // EMPLOYER sees only the employer area; everyone else bounces to their own hub.
    if (wrongRole) {
      router.replace(getDashboardPath(user!.role));
    }
  }, [status, wrongRole, user, router]);

  if (status !== "authenticated" || wrongRole) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
