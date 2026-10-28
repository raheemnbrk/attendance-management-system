"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useAuthStore } from "./auth.store";

// Employer-only routes: bounces unauthenticated visitors back to /login and
// shows a "not authorized" state for authenticated non-employers.
export function EmployerRoute({ children }: { children: ReactNode }) {
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

  if (!user || user.role !== "EMPLOYER") {
    return (
      <div className="flex flex-1 items-center justify-center p-16 text-sm text-muted-foreground">
        You do not have access to the employer area.
      </div>
    );
  }

  return <>{children}</>;
}
