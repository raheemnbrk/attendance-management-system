"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useLogout } from "@/features/auth/use-auth";
import { env } from "@/shared/config/env";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { ThemeToggle } from "./theme-toggle";

export type AppNavItem = { href: string; label: string; icon: LucideIcon };

// Default (employer) navigation; admin pages pass their own set + hrefs.
const EMPLOYER_NAV_ITEMS: AppNavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/employees", label: "Employees", icon: Users },
  { href: "/employer/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/employer/reports", label: "Reports", icon: BarChart3 },
  { href: "/employer/entry-qr", label: "Entry QR", icon: QrCode },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNav({
  items,
  className,
  onNavigate,
}: {
  items: AppNavItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 p-3", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-semibold tracking-tight",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        A
      </span>
      {env.NEXT_PUBLIC_APP_NAME}
    </Link>
  );
}

function UserMenu({ profileHref }: { profileHref: string }) {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(user.name)}
          </span>
          <span className="hidden max-w-36 truncate sm:inline">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Badge variant="muted" className="mb-2 ml-2">
          {user.role}
        </Badge>
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <UserRound aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => logout.mutate()}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  children,
  navItems = EMPLOYER_NAV_ITEMS,
  brandHref = "/employer/dashboard",
  profileHref = "/employer/profile",
}: {
  children: ReactNode;
  /** Sidebar items; defaults to the employer navigation. */
  navItems?: AppNavItem[];
  /** Where the brand/logo and mobile title link to. */
  brandHref?: string;
  /** "Profile" entry inside the user menu. */
  profileHref?: string;
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        data-print-hide
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card md:flex md:flex-col"
      >
        <Brand href={brandHref} />
        <SidebarNav items={navItems} className="flex-1 overflow-y-auto" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          data-print-hide
          className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur"
        >
          {/* Mobile navigation sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand href={brandHref} />
              <SidebarNav items={navItems} className="flex-1 overflow-y-auto pb-6" />
            </SheetContent>
          </Sheet>

          <Link href={brandHref} className="truncate text-sm font-semibold tracking-tight md:hidden">
            {env.NEXT_PUBLIC_APP_NAME}
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu profileHref={profileHref} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
