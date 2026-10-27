"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useLogout } from "@/features/auth/use-auth";
import { env } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-black/[.08] bg-background/80 backdrop-blur dark:border-white/[.145]">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            {env.NEXT_PUBLIC_APP_NAME}
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
                {user.email}
              </span>
              <span className="rounded-full border border-black/[.08] px-2 py-0.5 text-xs font-medium uppercase tracking-wide dark:border-white/[.145]">
                {user.role}
              </span>
              <Button variant="outline" onClick={() => logout.mutate()}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
