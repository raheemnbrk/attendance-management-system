import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { palettes, type ColorSchemeName, type ThemeColors } from "./colors";

export type ThemeScheme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "punchin.theme";

type ThemeContextValue = {
  colors: ThemeColors;
  scheme: ThemeScheme;
  isDark: boolean;
  setScheme: (scheme: ThemeScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredScheme(value: string | null): ThemeScheme {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [scheme, setSchemeState] = useState<ThemeScheme>("system");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && stored) {
          setSchemeState(readStoredScheme(stored));
        }
      })
      .catch(() => {
        // A missing or unreadable theme choice falls back to the default.
      });
    return () => {
      active = false;
    };
  }, []);

  const setScheme = (next: ThemeScheme) => {
    setSchemeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
      // The choice still applies for this session even if persisting failed.
    });
  };

  const isDark: boolean =
    scheme === "system" ? systemScheme !== "light" : scheme === "dark";

  const colors: ThemeColors = palettes[(isDark ? "dark" : "light") as ColorSchemeName];

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, scheme, isDark, setScheme }),
    [colors, scheme, isDark],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
