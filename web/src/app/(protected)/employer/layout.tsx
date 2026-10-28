import type { ReactNode } from "react";
import { EmployerRoute } from "@/features/auth/employer-route";

// Auth is resolved on the client (silent refresh + in-memory access token),
// so this segment intentionally renders a loading state until the session is
// known. Opt out of instant-navigation validation for it. The auth gate and
// app shell live in the parent (protected) layout.
export const instant = false;

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return <EmployerRoute>{children}</EmployerRoute>;
}
