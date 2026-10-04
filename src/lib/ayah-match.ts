/**
 * Finds which ayah a spoken recitation came from.
 *
 * The transcript comes back in plain modern spelling ("القرآن") while the
 * surah pages hold Uthmani text ("ٱلْقُرْءَانِ"), so both are reduced to a
 * bare letter skeleton before comparing: no harakat or Quranic marks, one
 * alif for every hamza seat, and no alif at all — the scripts disagree about
 * where an alif is written (ٰ, ٱ), so it is the least reliable letter.
 *
 * Words are matched whole (a word found inside a longer word counts half), and
 * words heard in the same order as the ayah score again — "لكم من الشجر" is
 * ayah 80 of Yasin, not ayah 21 where "لكم" hides inside "يسألكم".
 *
 * Recitation that runs over the end of one ayah into the next is credited to
 * the later ayah, because the page is a bookmark of where the member stopped.
 *
 * Kept in step with iOS `AyahMatcher.swift` and Android `AyahMatcher.kt`.
 */

export interface MatchableAyah {
  number: number;
  text?: string;
  first?: string;
  last?: string;
}

const MIN_SCORE = 0.3;

const skeleton = (word: string): string =>
  word
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^ء-ي]/g, "");

/** Skeleton words, alif dropped only after the length check so إن and ما still count. */
export const ayahWords = (text: string): string[] =>
  text
    .split(/\s+/)
    .map(skeleton)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/ا/g, ""));

const score = (heard: string[], ayah: string[]): number => {
  if (heard.length === 0) return 0;
  const whole = new Set(ayah);
  let found = 0;
  for (const w of heard) {
    if (whole.has(w)) {
      found += 1;
    } else if (w.length >= 3 && ayah.some((a) => a.length >= 3 && (a.includes(w) || w.includes(a)))) {
      found += 0.5;
    }
  }
  const pairs = new Set<string>();
  for (let i = 0; i + 1 < ayah.length; i++) pairs.add(`${ayah[i]} ${ayah[i + 1]}`);
  let inOrder = 0;
  for (let i = 0; i + 1 < heard.length; i++) {
    if (pairs.has(`${heard[i]} ${heard[i + 1]}`)) inOrder += 1;
  }
  return (found + inOrder) / (heard.length + Math.max(heard.length - 1, 0));
};

const fullText = (ayah: MatchableAyah): string =>
  ayah.text ?? [ayah.first, ayah.last].filter(Boolean).join(" ");

/** The ayah number the recitation stopped at, or null when nothing fits well enough. */
export const findAyah = (transcript: string, ayahs: MatchableAyah[]): number | null => {
  const heard = ayahWords(transcript);
  if (heard.length === 0) return null;

  const words = ayahs.map((a) => ({ number: a.number, words: ayahWords(fullText(a)) }));
  let bestScore = -1;
  let bestNumber: number | null = null;

  for (let i = 0; i < words.length; i++) {
    const ayah = words[i];
    const single = score(heard, ayah.words);
    if (single > bestScore) {
      bestScore = single;
      bestNumber = ayah.number;
    }

    const next = words[i + 1];
    if (next) {
      const nextWords = new Set(next.words);
      const spanning = score(heard, [...ayah.words, ...next.words]);
      const heardInNext = heard.filter((w) => nextWords.has(w)).length;
      if (
        spanning > bestScore + 0.05 &&
        nextWords.has(heard[heard.length - 1]) &&
        heardInNext >= 2
      ) {
        bestScore = spanning;
        bestNumber = next.number;
      }
    }
  }

  return bestScore >= MIN_SCORE ? bestNumber : null;
};
