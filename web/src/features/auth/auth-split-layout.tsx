"use client";

import Link from "next/link";
import { Clock, Zap, BarChart3, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { env } from "@/shared/config/env";
import { ThemeToggle } from "@/shared/components/theme-toggle";

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: "Real-time attendance" },
  { icon: BarChart3, label: "Reports and exports" },
  { icon: ShieldCheck, label: "Secure role-based access" },
];

// Decorative dot grid + faint circles, tinted with the panel's foreground so
// they follow the theme automatically.
function BrandPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-primary-foreground opacity-10"
    >
      <defs>
        <pattern id="auth-brand-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-brand-dots)" />
      <circle cx="88%" cy="8%" r="130" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
      <circle cx="8%" cy="94%" r="190" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={
        className ??
        "grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
      }
    >
      <Clock className="size-5" aria-hidden="true" />
    </span>
  );
}

// Split auth layout: brand panel on the left (hidden on small screens, where a
// compact logo and headline are shown above the form instead), centered form
// column on the right with the theme toggle in its corner.
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden w-[44%] shrink-0 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 p-10 text-primary-foreground lg:flex lg:flex-col xl:w-[42%]">
        <BrandPattern />

        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/30">
            <Clock className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</span>
        </div>

        <div className="relative z-10 mt-auto mb-auto flex max-w-md flex-col gap-3 py-10">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            Attendance, without the paperwork
          </h1>
          <p className="text-balance text-sm text-primary-foreground/80 xl:text-base">
            Track your team&apos;s check-ins, review reports and manage employees from one place.
          </p>
        </div>

        <ul className="relative z-10 flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3 text-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/30">
                <feature.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="font-medium">{feature.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="relative flex min-h-dvh flex-1 flex-col">
        <div className="absolute top-3 right-3 z-10">
          <ThemeToggle />
        </div>

        {/* Mobile-only compact brand header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 text-foreground lg:hidden">
          <BrandMark />
          <div className="text-center">
            <p className="text-sm font-semibold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Attendance, without the paperwork
            </h1>
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="px-6 pb-4 text-center text-xs text-muted-foreground lg:hidden">
          Employer without an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register your company
          </Link>
        </footer>
      </div>
    </div>
  );
}
