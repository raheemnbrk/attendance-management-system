import { useEffect, useState } from "react";

/** Returns `Date.now()` on an interval so components tick without owning timers.
 * Used by the live timer and the corrected server clock. */
export function useTick(intervalMs: number, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const id = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [enabled, intervalMs]);

  return now;
}
