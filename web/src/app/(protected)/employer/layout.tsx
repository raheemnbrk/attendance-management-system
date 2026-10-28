import type { ReactNode } from "react";
import { EmployerRoute } from "@/features/auth/employer-route";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppShell } from "@/shared/components/app-shell";

// Auth is resolved on the client (silent refresh + in-memory access token),
// so this segment intentionally renders a loading state until the session is
// known. Opt out of instant-navigation validation for it.
export const instant = false;

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <EmployerRoute>
        <AppShell>{children}</AppShell>
      </EmployerRoute>
    </ProtectedRoute>
  );
}
