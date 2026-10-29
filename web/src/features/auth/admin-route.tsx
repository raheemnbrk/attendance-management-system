"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useAuthStore } from "./auth.store";

// Admin-only routes: unauthenticated visitors go to /login, authenticated
// non-admins see a "not authorized" state.
export function AdminRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <LoadingScreen />;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center p-16 text-sm text-muted-foreground">
        You do not have access to the admin area.
      </div>
    );
  }

  return <>{children}</>;
}
