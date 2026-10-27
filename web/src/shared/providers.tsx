"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { bootstrapAuth } from "@/features/auth/auth.store";
import { makeQueryClient } from "./lib/query-client";

function SessionBootstrap() {
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      {children}
    </QueryClientProvider>
  );
}
