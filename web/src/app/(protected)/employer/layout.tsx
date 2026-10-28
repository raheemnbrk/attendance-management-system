import type { ReactNode } from "react";
import { EmployerRoute } from "@/features/auth/employer-route";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppShell } from "@/shared/components/app-shell";

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <EmployerRoute>
        <AppShell>{children}</AppShell>
      </EmployerRoute>
    </ProtectedRoute>
  );
}
