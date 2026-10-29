import type { ReactNode } from "react";
import { AdminShell } from "@/features/auth/admin-shell";

// Auth + role are resolved on the client (silent refresh + in-memory access
// token), so this segment intentionally renders a loading state until the
// session is known. Opt out of instant-navigation validation for it.
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
