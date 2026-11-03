import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  IQAMA_MINUTES,
  TZ_AREA_ID,
  UAE_AREAS,
  formatCountdown,
  formatMinutesSeconds,
  iqamaWait,
  formatPrayerClock,
  nextPrayer,
  prayersForDay,
  readAreaId,
  saveAreaId,
  type IqamaWait,
} from "@/lib/prayer-times";

/**
 * Today's adhan + iqama times, UAE Awqaf method. The next prayer is highlighted with a countdown.
 * Area is saved on this device; outside the UAE it falls back to the time zone's city (no iqama).
 */
export const PrayerTimesCard = () => {
  const [areaId, setAreaId] = useState(readAreaId);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 1_000);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const minuteKey = Math.floor(now.getTime() / 60_000);
  const day = useMemo(() => prayersForDay(areaId, 0, now), [areaId, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = useMemo(() => nextPrayer(areaId, now), [areaId, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const wait = iqamaWait(day, now);
  const { area } = day;
  const tz = area.timeZone;
  const clock = (d: Date) => formatPrayerClock(d, tz);

  const changeArea = (id: string) => {
    setAreaId(id);
    saveAreaId(id);
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">🕌 Prayer Times</h3>
        <Select value={areaId} onValueChange={changeArea}>
          <SelectTrigger className="w-auto min-w-[10rem] h-9" aria-label="Area">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>UAE (Awqaf)</SelectLabel>
              {UAE_AREAS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Outside the UAE</SelectLabel>
              <SelectItem value={TZ_AREA_ID}>My time zone</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {wait ? (
        <IqamaBox wait={wait} now={now} clock={clock} />
      ) : (
        <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 mb-3 text-center">
          <p className="text-sm text-muted-foreground">
            Next: <span className="font-semibold text-foreground">{next.label}</span>
            {next.tomorrow && " (tomorrow)"} at <span className="font-semibold text-foreground">{clock(next.adhan)}</span>
          </p>
          <p className="text-2xl font-bold text-primary mt-0.5">in {formatCountdown(next.adhan.getTime() - now.getTime())}</p>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto] text-sm sm:text-base">
        <div className="text-xs text-muted-foreground pb-1">Prayer</div>
        <div className="text-xs text-muted-foreground pb-1 pl-5 sm:pl-8 text-right">Adhan</div>
        <div className="text-xs text-muted-foreground pb-1 pl-5 sm:pl-8 text-right">{area.isUAE ? "Iqama" : ""}</div>
        {day.rows.map((row) => {
          const isNow = wait?.row.key === row.key;
          const isNext = !wait && !next.tomorrow && row.key === next.key;
          const passed = row.adhan.getTime() <= now.getTime() && !isNext && !isNow;
          const cell = cn(
            "py-2 border-t border-border",
            isNext && "font-semibold text-primary",
            isNow && "font-semibold text-amber-600 dark:text-amber-400",
            passed && "text-muted-foreground",
          );
          return (
            <div key={row.key} className="contents">
              <div className={cell}>
                {row.label}
                {isNow && (
                  <span className="ml-1.5 rounded-md bg-amber-500 px-1.5 py-px text-[11px] font-semibold text-white align-[1px]">
                    Now
                  </span>
                )}
              </div>
              <div className={cn(cell, "pl-5 sm:pl-8 text-right tabular-nums")}>{clock(row.adhan)}</div>
              <div className={cn(cell, "pl-5 sm:pl-8 text-right tabular-nums")}>
                {row.key === "dhuhr" && day.khutbah ? (
                  <span>Khutbah {clock(day.khutbah)}</span>
                ) : row.iqama ? (
                  clock(row.iqama)
                ) : (
                  <span className="text-muted-foreground">{row.key === "sunrise" ? "" : "–"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        {area.isUAE
          ? `${area.name} · ${day.official ? "Awqaf official timetable" : "UAE Awqaf method"}. Iqama: Fajr +${IQAMA_MINUTES.fajr} min, Maghrib +${IQAMA_MINUTES.maghrib}, others +${IQAMA_MINUTES.dhuhr}. Your mosque's board may differ by a minute or two.`
          : `${area.name} · Muslim World League method, worked out from your time zone. Iqama varies by mosque, so check yours.`}
      </p>
    </div>
  );
};

/** Adhan has been called: count down to iqama (or the Friday khutbah) in minutes and seconds. */
const IqamaBox = ({ wait, now, clock }: { wait: IqamaWait; now: Date; clock: (d: Date) => string }) => {
  const left = wait.target.getTime() - now.getTime();
  const total = wait.target.getTime() - wait.row.adhan.getTime();
  const done = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 1;
  return (
    <div
      className="rounded-xl bg-amber-500/10 border border-amber-500/40 px-4 pt-3 pb-3.5 mb-3 text-center"
      role="timer"
      aria-live="off"
    >
      <p className="text-sm font-semibold tracking-wide text-amber-600 dark:text-amber-400">
        {wait.isKhutbah ? "Khutbah Starts in..." : "Iqama Starts in..."}
      </p>
      <p className="text-5xl font-bold leading-tight tabular-nums text-amber-600 dark:text-amber-400">
        {formatMinutesSeconds(left)}
      </p>
      <div className="flex justify-center gap-11 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>min</span>
        <span>sec</span>
      </div>
      <div className="mx-2 mt-2.5 h-1.5 overflow-hidden rounded-full bg-amber-500/25">
        <div className="h-full rounded-full bg-amber-500 transition-[width] duration-1000 ease-linear" style={{ width: `${done * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{wait.row.label}</span> {wait.isKhutbah ? "khutbah" : "iqama"} at{" "}
        <span className="font-semibold text-foreground">{clock(wait.target)}</span>
      </p>
    </div>
  );
};
