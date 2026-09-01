/**
 * The verses covered by one Quran reading.
 *
 * The website has always written a range as `1 → 10`, but the phone used to
 * write `1_10` (or `full_chapter`) and count every reading as 1 whatever it
 * covered. The two apps share one account, so the website has to understand
 * everything either of them has ever saved — otherwise a reading logged on the
 * phone shows up here as "Verses 1_10 → undefined".
 */
export interface QuranRange {
  start: number;
  end: number;
}

/** The form both the phone and the website store. */
export function formatRange(range: QuranRange): string {
  return `${range.start} → ${range.end}`;
}

/** What a person reads on a card. */
export function displayRange(range: QuranRange): string {
  return range.start === range.end
    ? `Verse ${range.start}`
    : `Verses ${range.start}–${range.end}`;
}

/**
 * The number of verses in a surah, taken from the name the picker shows —
 * `4. An-Nisa (176 verses)`. Zero when the name does not say.
 */
export function totalVersesInName(name: string): number {
  const match = name.match(/\((\d+)\s*verses?\)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Reads a range in any form either app has saved: `1 → 10`, `1_10`, `1-10`.
 * `full_chapter` carries no numbers, so it needs the surah's length.
 */
export function parseRange(raw: string | null | undefined, totalVerses = 0): QuranRange | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (value === "full_chapter") {
    return totalVerses > 0 ? { start: 1, end: totalVerses } : null;
  }

  const parts = value
    .split(/[→_\-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) return null;

  const start = parseInt(parts[0], 10);
  const end = parseInt(parts[1], 10);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 1 || end < start) return null;

  return { start, end };
}

/**
 * Groups the same reading together whichever app wrote it, so `1_10` and
 * `1 → 10` are one line rather than two.
 */
export function normalizeRangeKey(raw: string | null | undefined, name = ""): string {
  const parsed = parseRange(raw, totalVersesInName(name));
  return parsed ? formatRange(parsed) : (raw ?? "");
}

export interface QuranProgress {
  totalVerses: number;
  /** Every distinct verse recorded, however many sittings it took. */
  versesRead: number;
  /** The highest verse reached in any reading. */
  furthestVerse: number;
  hasReadAnything: boolean;
  isComplete: boolean;
  /** The verse to carry on from, or null once the surah is finished. */
  nextVerse: number | null;
}

/**
 * How far through one surah someone has got. Overlapping and repeated readings
 * count once — reading verse 5 twice does not put two verses behind you.
 */
export function buildProgress(totalVerses: number, ranges: QuranRange[]): QuranProgress {
  const covered = new Set<number>();

  for (const range of ranges) {
    // A stray range longer than the surah is clipped, so a typo can never
    // claim more of the Book than the surah holds.
    const last = totalVerses > 0 ? Math.min(range.end, totalVerses) : range.end;
    for (let verse = range.start; verse <= last; verse++) covered.add(verse);
  }

  const furthestVerse = covered.size ? Math.max(...covered) : 0;
  const hasReadAnything = furthestVerse > 0;
  const isComplete = totalVerses > 0 && furthestVerse >= totalVerses;

  return {
    totalVerses,
    versesRead: covered.size,
    furthestVerse,
    hasReadAnything,
    isComplete,
    nextVerse: !hasReadAnything ? 1 : isComplete ? null : furthestVerse + 1,
  };
}
