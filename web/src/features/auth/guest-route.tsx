"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useAuthStore } from "./auth.store";

function dashboardFor(role: string): string | null {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }
  if (role === "EMPLOYER") {
    return "/employer/dashboard";
  }
  // Employee accounts use the mobile app; leave them on the auth pages.
  return null;
}

// Auth pages are guest-only: signed-in employers/admins are bounced to their
// dashboard, while employees stay (their accounts use the mobile app).
export function GuestRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const router = useRouter();

  const destination = status === "authenticated" && role ? dashboardFor(role) : null;

  useEffect(() => {
    if (destination) {
      router.replace(destination);
    }
  }, [destination, router]);

  if (destination) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
