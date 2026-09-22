/**
 * Colour-coded tajweed, in the colours of the printed Dar al-Maarifah
 * mushaf — grouped by what the mouth does: reds stretch, green hums through
 * the nose, blue bounces, grey is silent. The iOS and Android apps use the
 * same rules and the same colours.
 */

export type TajweedRule =
  | "maddLazim"
  | "maddWajib"
  | "maddJaiz"
  | "maddTabii"
  | "ghunnah"
  | "qalqalah"
  | "silent";

export const TAJWEED_RULES: {
  rule: TajweedRule;
  name: string;
  instruction: string;
  color: string;
}[] = [
  { rule: "maddLazim", name: "Madd Lāzim", instruction: "Stretch 6 counts", color: "#8B0000" },
  { rule: "maddWajib", name: "Madd Wājib", instruction: "Stretch 4–5 counts", color: "#D0021B" },
  { rule: "maddJaiz", name: "Madd Jāʾiz", instruction: "Stretch 2, 4 or 6 counts", color: "#F57C00" },
  { rule: "maddTabii", name: "Madd Ṭabīʿī", instruction: "Stretch 2 counts", color: "#B8860B" },
  {
    rule: "ghunnah",
    name: "Ghunnah",
    instruction: "Nasal sound, 2 counts — ikhfāʾ, iqlāb, idghām with ghunnah, نّ and مّ",
    color: "#2E7D32",
  },
  { rule: "qalqalah", name: "Qalqalah", instruction: "Slight bounce on ق ط ب ج د", color: "#0288D1" },
  {
    rule: "silent",
    name: "Not pronounced",
    instruction: "Written but skipped — hamzat al-waṣl, lām shamsiyyah, idghām without ghunnah",
    color: "#9E9E9E",
  },
];

const COLOR = Object.fromEntries(TAJWEED_RULES.map((r) => [r.rule, r.color])) as Record<TajweedRule, string>;

/** The rule codes of the alquran.cloud `quran-tajweed` edition. */
function ruleFor(code: string): TajweedRule | undefined {
  switch (code) {
    case "m": return "maddLazim";
    case "o": return "maddWajib";
    case "p": return "maddJaiz";
    case "n": return "maddTabii";
    case "g": case "f": case "c": case "i": case "a": case "w": return "ghunnah";
    case "q": return "qalqalah";
    case "h": case "l": case "s": case "u": case "d": case "b": return "silent";
    default: return undefined;
  }
}

export interface TajweedRun {
  text: string;
  color?: string;
}

/**
 * Splits text[from, to) into runs, each marked letter in its rule's colour.
 * A mark that doesn't fit the text is skipped rather than trusted — a wrong
 * colour teaches a wrong rule.
 */
export function tajweedRuns(text: string, marks: string | undefined, from = 0, to = text.length): TajweedRun[] {
  const runs: TajweedRun[] = [];
  let cursor = from;
  const push = (start: number, end: number, color?: string) => {
    if (end > start) runs.push({ text: text.slice(start, end), color });
  };
  for (const run of marks ? marks.split(";") : []) {
    const [s, e, code] = run.split(",");
    const rule = ruleFor(code);
    let start = Number(s);
    let end = Number(e);
    if (!rule || !(start < end) || start < 0 || end > text.length) continue;
    start = Math.max(start, cursor);
    end = Math.min(end, to);
    if (start >= end) continue;
    push(cursor, start);
    push(start, end, COLOR[rule]);
    cursor = end;
  }
  push(cursor, to);
  return runs;
}

/**
 * The part of an ayah a surah page shows: all of it up to 8 words, otherwise
 * the first four and last four words around "...". Returned as ranges of the
 * original text so the colours still line up.
 */
export function ayahPreviewRanges(text: string): [number, number][] {
  const words: [number, number][] = [];
  let start = 0;
  for (const word of text.split(" ")) {
    words.push([start, start + word.length]);
    start += word.length + 1;
  }
  if (words.length <= 8) return [[0, text.length]];
  return [
    [words[0][0], words[3][1]],
    [words[words.length - 4][0], text.length],
  ];
}
