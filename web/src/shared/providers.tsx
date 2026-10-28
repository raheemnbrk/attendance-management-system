"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { bootstrapAuth } from "@/features/auth/auth.store";
import { makeQueryClient } from "./lib/query-client";
import { Toaster } from "./ui/sonner";

function SessionBootstrap() {
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap />
        <Toaster position="bottom-right" />
        {children}
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
