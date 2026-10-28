import type { ReactNode } from "react";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppShell } from "@/shared/components/app-shell";

// Auth is resolved on the client (silent refresh + in-memory access token),
// so this segment intentionally renders a loading state until the session is
// known. Opt out of instant-navigation validation for it.
export const instant = false;

// Single auth gate + app shell for everything inside the (protected) group.
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
