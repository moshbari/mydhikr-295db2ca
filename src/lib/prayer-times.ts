import { prayerHours, type PrayerKey } from "./prayer-math";
import { timeZoneId, zoneCoordinates } from "./theme";
import { AWQAF_ABU_DHABI } from "@/data/awqaf-abu-dhabi";

/**
 * Prayer + iqama times.
 *
 * UAE areas follow the official Awqaf timetable (awqaf.gov.ae): Fajr and Isha at 18.2°,
 * plus fixed corrections (in seconds) and Awqaf's habit of rounding every time UP.
 * Fitted to Awqaf's official Abu Dhabi tables (Nov 2026 - Dec 2027): about 19 in 20 prayer
 * times exact, never more than 1 minute out. Same arithmetic and numbers as iOS/Android.
 * Abu Dhabi shows Awqaf's OFFICIAL table (src/data/awqaf-abu-dhabi.ts, from their monthly PDFs)
 * for every date it covers; other areas and later dates use the calculation below.
 * Awqaf has no public feed, so nothing is fetched (works offline).
 *
 * Iqama gaps are Awqaf's: Fajr +25, Zuhr/Asr/Isha +20, Maghrib +8. Jumu'ah khutbah 12:45 (since Jan 2026).
 */

export type { PrayerKey };

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

/** Minutes added to the exact time before rounding UP to the minute (fitted to Awqaf; same as iOS/Android). */
const UAE_CORRECTION_MIN: Record<PrayerKey, number> = {
  fajr: -0.7,
  sunrise: -4.2,
  dhuhr: 1.75,
  asr: -0.15,
  maghrib: 2.35,
  isha: -1.15,
};

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
  /** True when the times come straight from Awqaf's published table. */
  official: boolean;
}

/** The zone's UTC offset (ms) at an instant. Uses formatToParts, so the DEVICE's zone never leaks in. */
function zoneOffsetMs(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour") % 24, n("minute"), n("second"));
  return asUTC - Math.floor(at.getTime() / 1000) * 1000;
}

/** Absolute instant for hour:minute on Y/M/D as a wall clock in `timeZone`. */
function instantIn(timeZone: string, y: number, m: number, d: number, hour: number, minute: number): Date {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = guess - zoneOffsetMs(timeZone, new Date(guess));
  return new Date(guess - zoneOffsetMs(timeZone, new Date(first)));
}

export function prayersForDay(areaId: string, dayOffset = 0, now = new Date()): DayPrayers {
  const area = resolveArea(areaId);
  const [y0, m0, d0] = ymdIn(now, area.timeZone);
  // Calendar arithmetic only (UTC fields), so the device's own zone never shifts the day.
  const date = new Date(Date.UTC(y0, m0 - 1, d0 + dayOffset));
  const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  const start = instantIn(area.timeZone, y, m, d, 0, 0);
  const noon = instantIn(area.timeZone, y, m, d, 12, 0);
  const tzHours = (Date.UTC(y, m - 1, d, 12) - noon.getTime()) / 3_600_000;
  const hours = prayerHours(y, m, d, area.lat, area.lon, tzHours, area.isUAE ? 18.2 : 18, area.isUAE ? 18.2 : 17);

  const isFriday = date.getUTCDay() === 5;
  const khutbah = area.isUAE && isFriday ? instantIn(area.timeZone, y, m, d, JUMUAH_KHUTBAH.hour, JUMUAH_KHUTBAH.minute) : null;

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const official = area.id === "abu-dhabi" ? AWQAF_ABU_DHABI[iso]?.split(" ") : undefined;

  const rows = PRAYER_ORDER.map((key, i) => {
    const adhan = official
      ? new Date(`${iso}T${official[i]}:00+04:00`)
      : new Date(
          start.getTime() +
            (area.isUAE ? Math.ceil(hours[key] * 60 + UAE_CORRECTION_MIN[key]) : Math.round(hours[key] * 60)) * 60_000,
        );
    const gap = area.isUAE ? IQAMA_MINUTES[key] : undefined;
    let iqama = gap != null ? new Date(adhan.getTime() + gap * 60_000) : null;
    let label = PRAYER_LABELS[key];
    if (key === "dhuhr" && khutbah) {
      label = "Jumu'ah";
      iqama = null;
    }
    return { key, label, adhan, iqama };
  });

  return { area, isFriday, khutbah, rows, official: !!official };
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

/** Between a prayer's adhan and its iqama (or, on Friday, the Jumu'ah khutbah): what we're waiting for. */
export interface IqamaWait {
  row: PrayerRow;
  target: Date;
  isKhutbah: boolean;
}

export function iqamaWait(day: DayPrayers, now = new Date()): IqamaWait | null {
  for (const row of day.rows) {
    const isKhutbah = row.key === "dhuhr" && !!day.khutbah;
    const target = isKhutbah ? day.khutbah : row.iqama;
    if (!target) continue;
    if (now.getTime() >= row.adhan.getTime() && now.getTime() < target.getTime()) return { row, target, isKhutbah };
  }
  return null;
}

/** "07:42": minutes and seconds left (rounded up so 00:00 is the moment itself). Same as iOS. */
export function formatMinutesSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
