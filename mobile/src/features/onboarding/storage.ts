import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const WELCOME_STORAGE_KEY = "punchin.hasSeenWelcome";

export async function hasSeenWelcome(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WELCOME_STORAGE_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(WELCOME_STORAGE_KEY, "true");
  } catch {
    // If the flag cannot be persisted the welcome screen will simply be
    // shown again on the next launch.
  }
}

/** Startup flag: `value` is null until AsyncStorage answered, so the router
 * can keep the splash screen visible while it loads. */
export function useHasSeenWelcome(): { value: boolean | null; loading: boolean } {
  const [value, setValue] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    hasSeenWelcome()
      .then((seen) => {
        if (active) setValue(seen);
      })
      .catch(() => {
        if (active) setValue(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { value, loading: value === null };
}
