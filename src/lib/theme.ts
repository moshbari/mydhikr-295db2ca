import { TZ_COORDINATES } from "./tz-coordinates";

/**
 * Automatic day/night theme. Same rules as the iOS and Android apps:
 * "auto" is dark from local sunset to the next sunrise, worked out from the
 * device's time zone — no location permission needed.
 */
export type ThemeMode = "auto" | "light" | "dark" | "system";

export const THEME_MODE_KEY = "theme_mode";
/** [lat, lon] of the time zone, cached so the inline script in index.html can pick the theme before React loads. */
export const THEME_COORDS_KEY = "theme_coords";

const MODES: ThemeMode[] = ["auto", "light", "dark", "system"];

export function readThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    return v && MODES.includes(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

export function timeZoneId(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

/** The time zone's main city; unknown zones fall back to the UTC offset's longitude at latitude 25. */
export function zoneCoordinates(zone = timeZoneId(), now = new Date()): [number, number] {
  return TZ_COORDINATES[zone] ?? [25, (-now.getTimezoneOffset() / 60) * 15];
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  /** Set when the sun never rises ("night") or never sets ("day") on this date. */
  polar: "day" | "night" | null;
}

const RAD = Math.PI / 180;

/** NOAA sunrise equation (zenith 90.833°) for the local calendar date of `date`. */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const jNoon = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) / 86400000 + 2440587.5;
  const n = Math.round(jNoon - 2451545);
  const jStar = n - lon / 360;
  const m = (357.5291 + 0.98560028 * jStar) % 360;
  const c = 1.9148 * Math.sin(m * RAD) + 0.02 * Math.sin(2 * m * RAD) + 0.0003 * Math.sin(3 * m * RAD);
  const lambda = (m + c + 180 + 102.9372) % 360;
  const jTransit = 2451545 + jStar + 0.0053 * Math.sin(m * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
  if (cosH > 1) return { sunrise: null, sunset: null, polar: "night" };
  if (cosH < -1) return { sunrise: null, sunset: null, polar: "day" };
  const h = Math.acos(cosH) / RAD / 360;
  const toDate = (j: number) => new Date((j - 2440587.5) * 86400000);
  return { sunrise: toDate(jTransit - h), sunset: toDate(jTransit + h), polar: null };
}

export function isNight(now: Date, lat: number, lon: number): boolean {
  const t = sunTimes(now, lat, lon);
  if (t.polar) return t.polar === "night";
  return now < t.sunrise! || now >= t.sunset!;
}

export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function resolveDark(mode: ThemeMode, now = new Date()): boolean {
  switch (mode) {
    case "light":
      return false;
    case "dark":
      return true;
    case "system":
      return systemPrefersDark();
    default: {
      const [lat, lon] = zoneCoordinates(timeZoneId(), now);
      return isNight(now, lat, lon);
    }
  }
}

/** Puts the `dark` class on <html> to match `mode` right now. */
export function applyTheme(mode = readThemeMode(), now = new Date()) {
  const dark = resolveDark(mode, now);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0a110e" : "#16a34a");
  try {
    localStorage.setItem(THEME_COORDS_KEY, JSON.stringify(zoneCoordinates(timeZoneId(), now)));
  } catch {
    /* private mode: the inline script just falls back to the clock */
  }
}

export function formatClock(d: Date | null): string {
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}
