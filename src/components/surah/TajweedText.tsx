import { Fragment } from "react";
import { ayahPreviewRanges, tajweedRuns } from "@/lib/tajweed";

interface TajweedTextProps {
  text: string;
  /** This ayah's marks from TAJWEED_MARKS, or undefined for plain text. */
  marks?: string;
}

/** An ayah as the surah pages show it, with its tajweed letters coloured. */
export function TajweedText({ text, marks }: TajweedTextProps) {
  const ranges = ayahPreviewRanges(text);
  return (
    <>
      {ranges.map(([from, to], i) => (
        <Fragment key={from}>
          {i > 0 && " ... "}
          {tajweedRuns(text, marks, from, to).map((run, j) =>
            run.color ? (
              <span key={j} style={{ color: run.color }}>
                {run.text}
              </span>
            ) : (
              <Fragment key={j}>{run.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
