import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  IQAMA_MINUTES,
  TZ_AREA_ID,
  UAE_AREAS,
  formatCountdown,
  formatPrayerClock,
  nextPrayer,
  prayersForDay,
  readAreaId,
  saveAreaId,
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
    const timer = window.setInterval(tick, 30_000);
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

      <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 mb-3 text-center">
        <p className="text-sm text-muted-foreground">
          Next: <span className="font-semibold text-foreground">{next.label}</span>
          {next.tomorrow && " (tomorrow)"} at <span className="font-semibold text-foreground">{clock(next.adhan)}</span>
        </p>
        <p className="text-2xl font-bold text-primary mt-0.5">in {formatCountdown(next.adhan.getTime() - now.getTime())}</p>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] text-sm sm:text-base">
        <div className="text-xs text-muted-foreground pb-1">Prayer</div>
        <div className="text-xs text-muted-foreground pb-1 pl-5 sm:pl-8 text-right">Adhan</div>
        <div className="text-xs text-muted-foreground pb-1 pl-5 sm:pl-8 text-right">{area.isUAE ? "Iqama" : ""}</div>
        {day.rows.map((row) => {
          const isNext = !next.tomorrow && row.key === next.key;
          const passed = row.adhan.getTime() <= now.getTime() && !isNext;
          const cell = cn("py-2 border-t border-border", isNext && "font-semibold text-primary", passed && "text-muted-foreground");
          return (
            <div key={row.key} className="contents">
              <div className={cell}>{row.label}</div>
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
          ? `${area.name} · UAE Awqaf method. Iqama: Fajr +${IQAMA_MINUTES.fajr} min, Maghrib +${IQAMA_MINUTES.maghrib}, others +${IQAMA_MINUTES.dhuhr}. Your mosque's board may differ by a minute or two.`
          : `${area.name} · Muslim World League method, worked out from your time zone. Iqama varies by mosque, so check yours.`}
      </p>
    </div>
  );
};
