"use client";

import { Building2, LayoutDashboard, Users } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/shared/components/app-shell";
import { AdminRoute } from "./admin-route";

// Defined inside a client module: React cannot serialize component values
// (nav icons) across the server/client boundary, so layouts must not pass
// them directly to AppShell.
const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employers", label: "Employers", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

// Gate + shell for every admin page.
export function AdminShell({ children }: { children: ReactNode }) {
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
