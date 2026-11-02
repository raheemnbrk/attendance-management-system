import { z } from "zod";

/** Theme choice persisted alongside the profile (AsyncStorage, non secret). */
export const themeSchemeValues = ["light", "dark", "system"] as const;

export const themeSchemeSchema = z.enum(themeSchemeValues);

export type ThemeChoice = z.infer<typeof themeSchemeSchema>;
