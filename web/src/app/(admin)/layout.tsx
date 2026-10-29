import { Building2, LayoutDashboard, Users } from "lucide-react";
import type { ReactNode } from "react";
import { AdminRoute } from "@/features/auth/admin-route";
import { AppShell } from "@/shared/components/app-shell";

// Auth + role are resolved on the client (silent refresh + in-memory access
// token), so this segment intentionally renders a loading state until the
// session is known. Opt out of instant-navigation validation for it.
export const instant = false;

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employers", label: "Employers", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AppShell
        navItems={ADMIN_NAV_ITEMS}
        brandHref="/admin/dashboard"
        profileHref="/admin/profile"
      >
        {children}
      </AppShell>
    </AdminRoute>
  );
}
