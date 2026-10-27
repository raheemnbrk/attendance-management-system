import type { ReactNode } from "react";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppShell } from "@/shared/components/app-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
