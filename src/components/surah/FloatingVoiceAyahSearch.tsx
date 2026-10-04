import { VoiceAyahSearch } from "@/components/surah/VoiceAyahSearch";

interface AyahData {
  number: number;
  first?: string;
  last?: string;
  text?: string;
}

interface FloatingVoiceAyahSearchProps {
  ayahs: AyahData[];
  onAyahFound: (ayahNumber: number) => void;
  surahName?: string;
  accentColor?: string;
}

export function FloatingVoiceAyahSearch({
  ayahs,
  onAyahFound,
  surahName,
  accentColor,
}: FloatingVoiceAyahSearchProps) {
  return (
    <div className="fixed left-1/2 z-50 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+88px)]">
      <div className="rounded-full shadow-xl">
        <VoiceAyahSearch ayahs={ayahs} onAyahFound={onAyahFound} surahName={surahName} accentColor={accentColor} />
      </div>
    </div>
  );
}
