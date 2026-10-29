"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getDashboardPath } from "@/shared/lib/dashboard-path";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useAuthStore } from "./auth.store";

// Admin-only routes: unauthenticated visitors go to /login; authenticated
// non-admins are redirected to their OWN dashboard (never a dead end page).
export function AdminRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const wrongRole = status === "authenticated" && user && user.role !== "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // ADMIN sees only the admin area; everyone else bounces to their own hub.
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
