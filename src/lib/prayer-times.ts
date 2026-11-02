import { CalculationMethod, CalculationParameters, Coordinates, Madhab, PrayerTimes, Rounding } from "adhan";
import { timeZoneId, zoneCoordinates } from "./theme";

/**
 * Prayer + iqama times.
 *
 * UAE areas follow the official Awqaf timetable (awqaf.gov.ae): Fajr and Isha at 18.2°,
 * plus fixed corrections (in seconds) and Awqaf's habit of rounding every time UP.
 * Fitted to Awqaf's official Abu Dhabi tables for Nov + Dec 2026 (61 days): the five
 * prayers match exactly on all but a handful of days, never more than 1 minute out.
 * Awqaf has no public feed, so the times are worked out here (offline, no API).
 *
 * Iqama gaps are Awqaf's: Fajr +25, Zuhr/Asr/Isha +20, Maghrib +8. Jumu'ah khutbah 12:45 (since Jan 2026).
 */

export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerArea {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

/** Awqaf groups its many districts into a few zones; one reference point per zone. */
export const UAE_AREAS: PrayerArea[] = [
  { id: "abu-dhabi", name: "Abu Dhabi", lat: 24.4667, lon: 54.3667 },
  { id: "al-ain", name: "Al Ain", lat: 24.2075, lon: 55.7447 },
  { id: "madinat-zayed", name: "Al Dhafra (Madinat Zayed)", lat: 23.6833, lon: 53.7044 },
  { id: "ruwais", name: "Ruwais", lat: 24.1103, lon: 52.7306 },
  { id: "dubai", name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { id: "sharjah", name: "Sharjah", lat: 25.3463, lon: 55.4209 },
  { id: "ajman", name: "Ajman", lat: 25.4052, lon: 55.5136 },
  { id: "umm-al-quwain", name: "Umm Al Quwain", lat: 25.5647, lon: 55.5552 },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah", lat: 25.7895, lon: 55.9432 },
  { id: "fujairah", name: "Fujairah", lat: 25.1288, lon: 56.3265 },
  { id: "khor-fakkan", name: "Khor Fakkan", lat: 25.3391, lon: 56.3563 },
];

/** Outside the UAE: the time zone's main city, Muslim World League method, no iqama (mosques differ). */
export const TZ_AREA_ID = "my-time-zone";

export const PRAYER_AREA_KEY = "prayer_area";
const UAE_ZONE = "Asia/Dubai";

export const IQAMA_MINUTES: Partial<Record<PrayerKey, number>> = {
  fajr: 25,
  dhuhr: 20,
  asr: 20,
  maghrib: 8,
  isha: 20,
};

export const JUMUAH_KHUTBAH = { hour: 12, minute: 45 };

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Zuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const PRAYER_ORDER: PrayerKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export function defaultAreaId(): string {
  return timeZoneId() === UAE_ZONE ? "abu-dhabi" : TZ_AREA_ID;
}

export function readAreaId(): string {
  try {
    const v = localStorage.getItem(PRAYER_AREA_KEY);
    if (v && (v === TZ_AREA_ID || UAE_AREAS.some((a) => a.id === v))) return v;
  } catch {
    /* private mode */
  }
  return defaultAreaId();
}

export function saveAreaId(id: string) {
  try {
    localStorage.setItem(PRAYER_AREA_KEY, id);
  } catch {
    /* private mode */
  }
}

export interface ResolvedArea {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** IANA zone the times are shown in. */
  timeZone: string;
  isUAE: boolean;
}

export function resolveArea(id: string): ResolvedArea {
  const uae = UAE_AREAS.find((a) => a.id === id);
  if (uae) return { ...uae, timeZone: UAE_ZONE, isUAE: true };
  const zone = timeZoneId();
  const [lat, lon] = zoneCoordinates(zone);
  const city = zone.split("/").pop()?.replace(/_/g, " ") || "your time zone";
  return { id: TZ_AREA_ID, name: city, lat, lon, timeZone: zone || "UTC", isUAE: false };
}

function uaeParameters(): CalculationParameters {
  const p = new CalculationParameters("Other", 18.2, 18.2);
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None; // corrections + rounding up are applied in uaeTime()
  return p;
}

/** Minutes added to the exact astronomical time before rounding up to the minute (fitted to Awqaf). */
const UAE_CORRECTION_MIN: Record<PrayerKey, number> = {
  fajr: -0.7,
  sunrise: -4.25,
  dhuhr: 1.8,
  asr: 0,
  maghrib: 2.4,
  isha: -1.1,
};

function uaeTime(exact: Date, key: PrayerKey): Date {
  const shifted = exact.getTime() + UAE_CORRECTION_MIN[key] * 60_000;
  return new Date(Math.ceil(shifted / 60_000) * 60_000);
}

/** Calendar Y/M/D of `now` in the given zone (the area's "today", not the device's). */
function ymdIn(now: Date, timeZone: string): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return [parts[0], parts[1], parts[2]];
}

export interface PrayerRow {
  key: PrayerKey;
  label: string;
  adhan: Date;
  iqama: Date | null;
}

export interface DayPrayers {
  area: ResolvedArea;
  /** Friday in the area: Zuhr becomes Jumu'ah. */
  isFriday: boolean;
  khutbah: Date | null;
  rows: PrayerRow[];
}

/** Absolute instant for hour:minute on Y/M/D in a zone with no DST (UAE) or via offset lookup. */
function instantIn(timeZone: string, y: number, m: number, d: number, hour: number, minute: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, hour, minute));
  const shown = new Date(guess.toLocaleString("en-US", { timeZone }));
  const asUTC = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (shown.getTime() - asUTC.getTime()));
}

export function prayersForDay(areaId: string, dayOffset = 0, now = new Date()): DayPrayers {
  const area = resolveArea(areaId);
  const [y, m, d] = ymdIn(now, area.timeZone);
  // adhan wants the local calendar date; build it from the area's Y/M/D.
  const date = new Date(y, m - 1, d + dayOffset);
  const params = area.isUAE ? uaeParameters() : CalculationMethod.MuslimWorldLeague();
  const t = new PrayerTimes(new Coordinates(area.lat, area.lon), date, params);

  const weekday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).getUTCDay();
  const isFriday = weekday === 5;
  const khutbah =
    area.isUAE && isFriday
      ? instantIn(area.timeZone, date.getFullYear(), date.getMonth() + 1, date.getDate(), JUMUAH_KHUTBAH.hour, JUMUAH_KHUTBAH.minute)
      : null;

  const rows = PRAYER_ORDER.map((key) => {
    const adhan = area.isUAE ? uaeTime(t[key] as Date, key) : (t[key] as Date);
    const gap = area.isUAE ? IQAMA_MINUTES[key] : undefined;
    let iqama = gap != null ? new Date(adhan.getTime() + gap * 60_000) : null;
    let label = PRAYER_LABELS[key];
    if (key === "dhuhr" && khutbah) {
      label = "Jumu'ah";
      iqama = null;
    }
    return { key, label, adhan, iqama };
  });

  return { area, isFriday, khutbah, rows };
}

/** The next prayer (sunrise skipped) after `now`, looking into tomorrow after Isha. */
export function nextPrayer(areaId: string, now = new Date()): PrayerRow & { tomorrow: boolean } {
  for (const offset of [0, 1]) {
    const day = prayersForDay(areaId, offset, now);
    const row = day.rows.find((r) => r.key !== "sunrise" && r.adhan.getTime() > now.getTime());
    if (row) return { ...row, tomorrow: offset === 1 };
  }
  const fallback = prayersForDay(areaId, 1, now).rows[0];
  return { ...fallback, tomorrow: true };
}

export function formatPrayerClock(d: Date, timeZone: string): string {
  return d.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
