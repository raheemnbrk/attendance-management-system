import type { ReactNode } from "react";
import { AuthSplitLayout } from "@/features/auth/auth-split-layout";
import { GuestRoute } from "@/features/auth/guest-route";

// Auth is resolved on the client (silent refresh + in-memory access token),
// so this segment intentionally renders a loading state until the session is
// known. Opt out of instant-navigation validation for it.
export const instant = false;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestRoute>
      <AuthSplitLayout>{children}</AuthSplitLayout>
    </GuestRoute>
  );
}
