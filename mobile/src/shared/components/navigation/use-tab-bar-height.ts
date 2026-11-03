import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Height of the floating glass pill. */
export const GLASS_TAB_BAR_HEIGHT = 68;

/** Space under the safe-area inset the pill floats at. */
export const GLASS_TAB_BAR_FLOAT_OFFSET = 12;

/** Extra breathing room between content and the floating bar. */
export const TAB_BAR_CONTENT_GAP = 24;

/**
 * Bottom padding tab screens must add so the last item is never hidden behind
 * the glass bar: tab bar height + safe-area inset + 24px. Content scrolls
 * underneath the glass pill by design.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return GLASS_TAB_BAR_HEIGHT + insets.bottom + TAB_BAR_CONTENT_GAP;
}
