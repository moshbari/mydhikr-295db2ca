import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { worshipMatchKey } from "@/lib/worship-name";
import { parseRange, totalVersesInName, type QuranRange } from "@/lib/quran-range";

interface Reading {
  name: string;
  extra_info: string | null;
}

/**
 * Where the member has got to in each surah, over every day they have ever
 * recorded — the answer to "where do I start again tomorrow" does not live in
 * today's list, it lives in all the days before it.
 *
 * `refresh` is called after a reading is added so the bookmark moves at once.
 */
export function useQuranProgress() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setReadings([]);
      return;
    }

    const { data, error } = await supabase
      .from("daily_entries")
      .select("name, extra_info")
      .eq("user_id", user.id)
      .eq("type", "quran")
      .order("created_at", { ascending: false })
      .limit(2000);

    // No progress line is better than a wrong one: if this does not arrive,
    // nothing else on the page is any different.
    if (error) return;
    setReadings((data as Reading[]) || []);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Every range ever recorded against one surah. */
  const rangesFor = useCallback(
    (name: string): QuranRange[] => {
      const trimmed = (name || "").trim();
      if (!trimmed) return [];

      const total = totalVersesInName(trimmed);
      // Not a surah (no verse count in the name), so there is no progress to
      // promise — a custom Quran type never gets a line it cannot honour.
      if (total <= 0) return [];

      const key = worshipMatchKey(trimmed);
      const ranges: QuranRange[] = [];

      readings.forEach((reading) => {
        if (worshipMatchKey(reading.name) !== key) return;
        const range = parseRange(reading.extra_info, total);
        if (range) ranges.push(range);
      });

      return ranges;
    },
    [readings]
  );

  return { rangesFor, refreshProgress: load };
}
