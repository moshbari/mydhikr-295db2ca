#!/usr/bin/env python3
"""Regenerates src/data/tajweed-marks.ts.

Downloads the alquran.cloud `quran-tajweed` edition (Tanzil Uthmani with each
rule marked as [code[letters]) and projects every mark onto the ayah text in
the four src/pages/Surah*.tsx pages, letter by letter. The ayahs themselves are
never changed; only which of their letters get coloured. The iOS app does the
same with moshbari/mydhikr-ios scripts/generate_tajweed.py.

    python3 scripts/generate-tajweed.py
"""
import difflib
import json
import os
import re
import unicodedata
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/data/tajweed-marks.ts")

# page -> (surah number, key in TAJWEED_MARKS)
SURAHS = {
    "SurahYasin": (36, "yasin"),
    "SurahWaqiah": (56, "waqiah"),
    "SurahKahf": (18, "kahf"),
    "SurahMulk": (67, "mulk"),
}

# Uthmani and Simple spell the same word differently on purpose, so letters are
# compared on their consonantal skeleton.
SKELETON = {"ٱ": "ا", "آ": "ا", "أ": "ا", "إ": "ا", "ٲ": "ا", "ٰ": "ا",
            "ى": "ي", "ٮ": "ا", "ة": "ه"}
DAGGER_ALEF = "ٰ"
MARK = re.compile(r"\[([a-z])(?::\d+)?\[")


def is_base(c):
    # Tatweel and the small silah waw/ya are not letters of the Simple text.
    if c == DAGGER_ALEF:
        return True
    return unicodedata.category(c).startswith("L") and c not in "ـۥۦۧ"


def is_mark(c):
    return unicodedata.category(c).startswith("M") and c != DAGGER_ALEF


def skeleton(text):
    return [(SKELETON.get(c, c), i) for i, c in enumerate(text) if is_base(c)]


def parse(marked):
    """Marked Uthmani -> (plain text, [(start, end, code)])."""
    plain, spans, i = [], [], 0
    while i < len(marked):
        m = MARK.match(marked, i)
        if m:
            j = marked.index("]", m.end())
            start = len(plain)
            plain.extend(marked[m.end():j])
            spans.append((start, len(plain), m.group(1)))
            i = j + 1
        else:
            plain.append(marked[i])
            i += 1
    return "".join(plain), spans


def project(uthmani, spans, simple):
    su, ss = skeleton(uthmani), skeleton(simple)
    matcher = difflib.SequenceMatcher(None, [c for c, _ in su], [c for c, _ in ss], autojunk=False)
    u2s = {}
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                u2s[su[i1 + k][1]] = ss[j1 + k][1]

    def cluster_start(i):
        while i > 0 and (is_mark(simple[i]) or simple[i] == DAGGER_ALEF):
            i -= 1
        return i

    def cluster_end(i):
        j = i + 1
        while j < len(simple) and (is_mark(simple[j]) or simple[j] in "ۥۦۧ"):
            j += 1
        return j

    marks = []
    for start, end, code in spans:
        bases = [i for i in range(start, end) if is_base(uthmani[i])]
        if not bases:  # only marks (e.g. small silah waw): colour their letter
            k = start - 1
            while k >= 0 and not is_base(uthmani[k]):
                k -= 1
            bases = [k] if k >= 0 else []
        idx = [u2s[i] for i in bases if i in u2s]
        if not idx:  # a silent letter the Simple text doesn't write
            continue
        # A madd carried by a dagger alef colours the dagger alef itself, as
        # the printed mushaf does, not the letter it sits on.
        s0 = idx[0] if simple[idx[0]] == DAGGER_ALEF else cluster_start(idx[0])
        e0 = cluster_end(max(idx))
        if marks and s0 < marks[-1][1]:
            s0 = marks[-1][1]
        if s0 < e0:
            marks.append((s0, e0, code))
    return marks, matcher.ratio()


def main():
    lines = [HEADER, "export const TAJWEED_MARKS: Record<TajweedSurah, string[]> = {"]
    for page, (number, key) in SURAHS.items():
        source = open(os.path.join(ROOT, f"src/pages/{page}.tsx"), encoding="utf-8").read()
        ayahs = [(int(n), t) for n, t in re.findall(r'\{ number: (\d+), text: "(.*?)" \}', source)]
        url = f"https://api.alquran.cloud/v1/surah/{number}/quran-tajweed"
        # curl, not urllib: the Mac's stock Python hangs on this TLS handshake.
        body = subprocess.run(["curl", "-sfS", "--max-time", "60", url], capture_output=True, check=True).stdout
        marked = json.loads(body)["data"]["ayahs"]
        assert len(marked) == len(ayahs), f"{page}: ayah count differs"

        lines.append(f"  {key}: [")
        for (n, text), a in zip(ayahs, marked):
            assert a["numberInSurah"] == n
            uthmani, spans = parse(a["text"])
            marks, ratio = project(uthmani, spans, text)
            # Same ayah, different spelling — anything lower is a different ayah.
            assert ratio >= 0.85, f"{page} {n}: texts don't match ({ratio:.2f})"
            lines.append('    "' + ";".join(f"{s},{e},{c}" for s, e, c in marks) + '",')
        lines.append("  ],")
    lines.append("};")
    open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("wrote", OUT)


HEADER = '''// GENERATED by scripts/generate-tajweed.py — do not hand-edit.
//
// Which letters of each ayah in src/pages/Surah*.tsx carry a tajweed rule, as
// "start,end,code" runs separated by ";". start/end are string offsets into
// that ayah's `text` (end exclusive). The rules come from the alquran.cloud
// `quran-tajweed` edition, projected letter-by-letter onto the pages' own text,
// so the ayahs themselves are untouched. If a page's text is ever changed,
// regenerate this file with it.
//
// Codes: m o p n = madd lazim / wajib / jaiz / tabii; g f c i a w = ghunnah;
// q = qalqalah; h l s u d b = not pronounced.

export type TajweedSurah = "yasin" | "waqiah" | "kahf" | "mulk";
'''

if __name__ == "__main__":
    main()
