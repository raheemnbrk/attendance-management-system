"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";
import { apiErrorMessage } from "@/shared/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

// Destructive alert for a failed query: shows the language message the server
// sent (no generic fallback copy) and, given an onRetry handler, a retry
// button wired to the query refetch.
export function QueryErrorAlert({
  title,
  error,
  onRetry,
  isRetrying = false,
  className,
}: {
  title: string;
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <ShieldAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <div className="mt-2 flex items-center justify-between gap-3 md:flex-row">
        <AlertDescription className="min-w-0 break-words">
          {apiErrorMessage(error)}
        </AlertDescription>
        {onRetry ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="shrink-0"
          >
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
