import { useCallback, useEffect, useState } from "react";
import { applyTheme, readThemeMode, THEME_MODE_KEY, type ThemeMode } from "@/lib/theme";

const CHANGED = "mydhikr-theme-mode";

/** The chosen Appearance, kept per device in localStorage. */
export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>(readThemeMode);

  useEffect(() => {
    const sync = () => setModeState(readThemeMode());
    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(THEME_MODE_KEY, next);
    } catch {
      /* private mode: still applies for this visit */
    }
    setModeState(next);
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return { mode, setMode };
}

/**
 * Keeps <html class="dark"> right while the app is open: re-checks every
 * minute (so it turns dark at sunset without a reload), when the tab comes
 * back, and when the phone's own setting flips.
 */
export function useThemeController() {
  const { mode } = useThemeMode();
  useEffect(() => {
    const apply = () => applyTheme(mode);
    apply();
    const timer = window.setInterval(apply, 60_000);
    const onVisible = () => document.visibilityState === "visible" && apply();
    document.addEventListener("visibilitychange", onVisible);
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", apply);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      media?.removeEventListener?.("change", apply);
    };
  }, [mode]);
}
