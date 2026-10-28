import { Building2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading session"
    >
      <Building2
        className="size-14 text-primary motion-reduce:animate-none animate-[office-bob_1.4s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-muted-foreground">Loading...</p>
    </div>
  );
}
