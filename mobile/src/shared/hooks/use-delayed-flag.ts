import { useEffect, useRef, useState } from "react";

/**
 * Gates a loading flag so very fast loads never flash a skeleton: the flag
 * only turns true once `active` has stayed on for at least `delayMs`. The
 * state change always happens inside the timer callback, never synchronously
 * during the effect, and rapid toggles converge because a new effect run
 * cancels the previous timer.
 */
export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(
      () => {
        timer.current = null;
        setVisible(active);
      },
      active ? delayMs : 0,
    );
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [active, delayMs]);

  return visible;
}
