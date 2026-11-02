/**
 * Sun-position arithmetic for prayer times (the classic PrayTimes method, refined three times).
 * Line-for-line the same as the iOS app's PrayerMath (MyDhikr/Utils/PrayerTimes.swift) and Android,
 * so every app shows the same minute. Returns hours after local midnight.
 */
export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const fix = (a: number, b: number) => {
  const r = a - b * Math.floor(a / b);
  return r < 0 ? r + b : r;
};

function julian(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function sun(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)), 360);
  const e = 23.439 - 0.00000036 * D;
  const ra = fix(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15, 24);
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - ra };
}

export function prayerHours(
  year: number,
  month: number,
  day: number,
  lat: number,
  lon: number,
  tzHours: number,
  fajrAngle: number,
  ishaAngle: number,
): Record<PrayerKey, number> {
  const jd = julian(year, month, day) - lon / (15 * 24);
  const midDay = (t: number) => fix(12 - sun(jd + t).eqt, 24);
  const angleTime = (angle: number, t: number, ccw: boolean) => {
    const { decl } = sun(jd + t);
    const noon = midDay(t);
    const x = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat)));
    const h = deg(Math.acos(Math.min(1, Math.max(-1, x)))) / 15;
    return noon + (ccw ? -h : h);
  };
  const asrTime = (t: number) => {
    const { decl } = sun(jd + t);
    const angle = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
    return angleTime(angle, t, false);
  };

  let t: Record<PrayerKey, number> = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 3; i++) {
    t = {
      fajr: angleTime(fajrAngle, t.fajr / 24, true),
      sunrise: angleTime(0.833, t.sunrise / 24, true),
      dhuhr: midDay(t.dhuhr / 24),
      asr: asrTime(t.asr / 24),
      maghrib: angleTime(0.833, t.maghrib / 24, false),
      isha: angleTime(ishaAngle, t.isha / 24, false),
    };
  }
  const shift = tzHours - lon / 15;
  return {
    fajr: t.fajr + shift,
    sunrise: t.sunrise + shift,
    dhuhr: t.dhuhr + shift,
    asr: t.asr + shift,
    maghrib: t.maghrib + shift,
    isha: t.isha + shift,
  };
}
