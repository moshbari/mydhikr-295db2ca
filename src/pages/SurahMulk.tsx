import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useSurahFontSize } from "@/hooks/use-surah-font-size";
import { FontSizeSelector } from "@/components/surah/FontSizeSelector";
import { VoiceAyahSearch } from "@/components/surah/VoiceAyahSearch";

const AYAH_DATA = [
  { number: 1, text: "تَبَٰرَكَ ٱلَّذِي بِيَدِهِ ٱلۡمُلۡكُ وَهُوَ عَلَىٰ كُلِّ شَيۡءٖ قَدِيرٌ" },
  { number: 2, text: "ٱلَّذِي خَلَقَ ٱلۡمَوۡتَ وَٱلۡحَيَوٰةَ لِيَبۡلُوَكُمۡ أَيُّكُمۡ أَحۡسَنُ عَمَلٗاۚ وَهُوَ ٱلۡعَزِيزُ ٱلۡغَفُورُ" },
  { number: 3, text: "ٱلَّذِي خَلَقَ سَبۡعَ سَمَٰوَٰتٖ طِبَاقٗاۖ مَّا تَرَىٰ فِي خَلۡقِ ٱلرَّحۡمَٰنِ مِن تَفَٰوُتٖۖ فَٱرۡجِعِ ٱلۡبَصَرَ هَلۡ تَرَىٰ مِن فُطُورٖ" },
  { number: 4, text: "ثُمَّ ٱرۡجِعِ ٱلۡبَصَرَ كَرَّتَيۡنِ يَنقَلِبۡ إِلَيۡكَ ٱلۡبَصَرُ خَاسِئٗا وَهُوَ حَسِيرٞ" },
  { number: 5, text: "وَلَقَدۡ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنۡيَا بِمَصَٰبِيحَ وَجَعَلۡنَٰهَا رُجُومٗا لِّلشَّيَٰطِينِۖ وَأَعۡتَدۡنَا لَهُمۡ عَذَابَ ٱلسَّعِيرِ" },
  { number: 6, text: "وَلِلَّذِينَ كَفَرُواْ بِرَبِّهِمۡ عَذَابُ جَهَنَّمَۖ وَبِئۡسَ ٱلۡمَصِيرُ" },
  { number: 7, text: "إِذَآ أُلۡقُواْ فِيهَا سَمِعُواْ لَهَا شَهِيقٗا وَهِيَ تَفُورُ" },
  { number: 8, text: "تَكَادُ تَمَيَّزُ مِنَ ٱلۡغَيۡظِۖ كُلَّمَآ أُلۡقِيَ فِيهَا فَوۡجٞ سَأَلَهُمۡ خَزَنَتُهَآ أَلَمۡ يَأۡتِكُمۡ نَذِيرٞ" },
  { number: 9, text: "قَالُواْ بَلَىٰ قَدۡ جَآءَنَا نَذِيرٞ فَكَذَّبۡنَا وَقُلۡنَا مَا نَزَّلَ ٱللَّهُ مِن شَيۡءٍ إِنۡ أَنتُمۡ إِلَّا فِي ضَلَٰلٖ كَبِيرٖ" },
  { number: 10, text: "وَقَالُواْ لَوۡ كُنَّا نَسۡمَعُ أَوۡ نَعۡقِلُ مَا كُنَّا فِيٓ أَصۡحَٰبِ ٱلسَّعِيرِ" },
  { number: 11, text: "فَٱعۡتَرَفُواْ بِذَنۢبِهِمۡ فَسُحۡقٗا لِّأَصۡحَٰبِ ٱلسَّعِيرِ" },
  { number: 12, text: "إِنَّ ٱلَّذِينَ يَخۡشَوۡنَ رَبَّهُم بِٱلۡغَيۡبِ لَهُم مَّغۡفِرَةٞ وَأَجۡرٞ كَبِيرٞ" },
  { number: 13, text: "وَأَسِرُّواْ قَوۡلَكُمۡ أَوِ ٱجۡهَرُواْ بِهِۦٓۖ إِنَّهُۥ عَلِيمُۢ بِذَاتِ ٱلصُّدُورِ" },
  { number: 14, text: "أَلَا يَعۡلَمُ مَنۡ خَلَقَ وَهُوَ ٱللَّطِيفُ ٱلۡخَبِيرُ" },
  { number: 15, text: "هُوَ ٱلَّذِي جَعَلَ لَكُمُ ٱلۡأَرۡضَ ذَلُولٗا فَٱمۡشُواْ فِي مَنَاكِبِهَا وَكُلُواْ مِن رِّزۡقِهِۦۖ وَإِلَيۡهِ ٱلنُّشُورُ" },
  { number: 16, text: "ءَأَمِنتُم مَّن فِي ٱلسَّمَآءِ أَن يَخۡسِفَ بِكُمُ ٱلۡأَرۡضَ فَإِذَا هِيَ تَمُورُ" },
  { number: 17, text: "أَمۡ أَمِنتُم مَّن فِي ٱلسَّمَآءِ أَن يُرۡسِلَ عَلَيۡكُمۡ حَاصِبٗاۖ فَسَتَعۡلَمُونَ كَيۡفَ نَذِيرِ" },
  { number: 18, text: "وَلَقَدۡ كَذَّبَ ٱلَّذِينَ مِن قَبۡلِهِمۡ فَكَيۡفَ كَانَ نَكِيرِ" },
  { number: 19, text: "أَوَلَمۡ يَرَوۡاْ إِلَى ٱلطَّيۡرِ فَوۡقَهُمۡ صَٰٓفَّٰتٖ وَيَقۡبِضۡنَۚ مَا يُمۡسِكُهُنَّ إِلَّا ٱلرَّحۡمَٰنُۚ إِنَّهُۥ بِكُلِّ شَيۡءِۭ بَصِيرٌ" },
  { number: 20, text: "أَمَّنۡ هَٰذَا ٱلَّذِي هُوَ جُندٞ لَّكُمۡ يَنصُرُكُم مِّن دُونِ ٱلرَّحۡمَٰنِۚ إِنِ ٱلۡكَٰفِرُونَ إِلَّا فِي غُرُورٍ" },
  { number: 21, text: "أَمَّنۡ هَٰذَا ٱلَّذِي يَرۡزُقُكُمۡ إِنۡ أَمۡسَكَ رِزۡقَهُۥۚ بَل لَّجُّواْ فِي عُتُوّٖ وَنُفُورٍ" },
  { number: 22, text: "أَفَمَن يَمۡشِي مُكِبًّا عَلَىٰ وَجۡهِهِۦٓ أَهۡدَىٰٓ أَمَّن يَمۡشِي سَوِيًّا عَلَىٰ صِرَٰطٖ مُّسۡتَقِيمٖ" },
  { number: 23, text: "قُلۡ هُوَ ٱلَّذِيٓ أَنشَأَكُمۡ وَجَعَلَ لَكُمُ ٱلسَّمۡعَ وَٱلۡأَبۡصَٰرَ وَٱلۡأَفۡـِٔدَةَۚ قَلِيلٗا مَّا تَشۡكُرُونَ" },
  { number: 24, text: "قُلۡ هُوَ ٱلَّذِي ذَرَأَكُمۡ فِي ٱلۡأَرۡضِ وَإِلَيۡهِ تُحۡشَرُونَ" },
  { number: 25, text: "وَيَقُولُونَ مَتَىٰ هَٰذَا ٱلۡوَعۡدُ إِن كُنتُمۡ صَٰدِقِينَ" },
  { number: 26, text: "قُلۡ إِنَّمَا ٱلۡعِلۡمُ عِندَ ٱللَّهِ وَإِنَّمَآ أَنَا۠ نَذِيرٞ مُّبِينٞ" },
  { number: 27, text: "فَلَمَّا رَأَوۡهُ زُلۡفَةٗ سِيٓـَٔتۡ وُجُوهُ ٱلَّذِينَ كَفَرُواْ وَقِيلَ هَٰذَا ٱلَّذِي كُنتُم بِهِۦ تَدَّعُونَ" },
  { number: 28, text: "قُلۡ أَرَءَيۡتُمۡ إِنۡ أَهۡلَكَنِيَ ٱللَّهُ وَمَن مَّعِيَ أَوۡ رَحِمَنَا فَمَن يُجِيرُ ٱلۡكَٰفِرِينَ مِنۡ عَذَابٍ أَلِيمٖ" },
  { number: 29, text: "قُلۡ هُوَ ٱلرَّحۡمَٰنُ ءَامَنَّا بِهِۦ وَعَلَيۡهِ تَوَكَّلۡنَاۖ فَسَتَعۡلَمُونَ مَنۡ هُوَ فِي ضَلَٰلٖ مُّبِينٖ" },
  { number: 30, text: "قُلۡ أَرَءَيۡتُمۡ إِنۡ أَصۡبَحَ مَآؤُكُمۡ غَوۡرٗا فَمَن يَأۡتِيكُم بِمَآءٖ مَّعِينِۭ" },
];

const TOTAL_AYAHS = 30;

const SurahMulk = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, boolean>>({});
  const [lastCheckedAyah, setLastCheckedAyah] = useState<number | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const { fontSize, fontSizeClass, handleFontSizeChange } = useSurahFontSize();
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollToAyah = (ayahNumber: number) => {
    const ref = ayahRefs.current[ayahNumber];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.classList.add('ring-4', 'ring-yellow-400');
      setTimeout(() => {
        ref.classList.remove('ring-4', 'ring-yellow-400');
      }, 2000);
    }
  };

  const handleVoiceAyahFound = (ayahNumber: number) => {
    scrollToAyah(ayahNumber);
    if (!progress[ayahNumber]) {
      handleCheckAyah(ayahNumber, true);
    }
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem("mulkProgress");
    const savedLastAyah = localStorage.getItem("mulkLastCheckedAyah");
    const savedTime = localStorage.getItem("mulkLastSaveTime");
    
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    if (savedLastAyah) setLastCheckedAyah(parseInt(savedLastAyah));
    if (savedTime) setLastSaveTime(savedTime);
  }, []);

  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem("mulkProgress", JSON.stringify(progress));
    }
  }, [progress]);

  const handleCheckAyah = async (ayahNumber: number, checked: boolean) => {
    await haptics.light();
    
    const newProgress = { ...progress };
    const currentTime = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    
    if (checked) {
      newProgress[ayahNumber] = true;
      setLastCheckedAyah(ayahNumber);
      localStorage.setItem("mulkLastCheckedAyah", ayahNumber.toString());
    } else {
      delete newProgress[ayahNumber];
      const checkedAyahs = Object.keys(newProgress).map(Number).filter(n => newProgress[n]);
      if (checkedAyahs.length > 0) {
        const highest = Math.max(...checkedAyahs);
        setLastCheckedAyah(highest);
        localStorage.setItem("mulkLastCheckedAyah", highest.toString());
      } else {
        setLastCheckedAyah(null);
        localStorage.removeItem("mulkLastCheckedAyah");
      }
    }
    
    setProgress(newProgress);
    setLastSaveTime(currentTime);
    localStorage.setItem("mulkLastSaveTime", currentTime);
  };

  const handleReset = async () => {
    await haptics.warning();
    if (window.confirm("هل أنت متأكد؟ - Are you sure you want to reset all progress?")) {
      await haptics.heavy();
      setProgress({});
      setLastCheckedAyah(null);
      setLastSaveTime(null);
      localStorage.removeItem("mulkProgress");
      localStorage.removeItem("mulkLastCheckedAyah");
      localStorage.removeItem("mulkLastSaveTime");
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TOTAL_AYAHS) * 100);

  const getAyahText = (ayahNumber: number) => {
    const ayah = AYAH_DATA.find(a => a.number === ayahNumber);
    if (!ayah) return "";
    const words = ayah.text.split(" ");
    if (words.length <= 8) return ayah.text;
    return `${words.slice(0, 4).join(" ")} ... ${words.slice(-4).join(" ")}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)" }}>
      <header className="text-white py-4 px-4 sm:py-6 sm:px-6 relative" style={{ background: "linear-gradient(135deg, #0d1642 0%, #1a237e 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await haptics.light(); navigate("/"); }}
            className="text-white hover:bg-white/20 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-center" style={{ fontFamily: "'Scheherazade New', serif" }}>
            سورة الملك
          </h1>
          <p className="text-center text-white/80 mt-1 text-sm sm:text-base">
            Surah Al-Mulk - {TOTAL_AYAHS} Ayahs
          </p>
        </div>
      </header>

      {/* Font Size Selector */}
      <FontSizeSelector 
        fontSize={fontSize} 
        onFontSizeChange={handleFontSizeChange}
        accentColor="#1a237e"
        rightElement={
          <VoiceAyahSearch 
            ayahs={AYAH_DATA} 
            onAyahFound={handleVoiceAyahFound}
            accentColor="#1a237e"
          />
        }
      />

      <div className="bg-gray-100 px-4 py-2 sm:px-6 sm:py-3 border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Progress value={progressPercent} className="h-6 sm:h-8" />
            <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium">
              {completedCount} / {TOTAL_AYAHS} ({progressPercent}%)
            </span>
          </div>
          {lastSaveTime && (
            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-2">
              Last saved: {lastSaveTime}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center py-2 sm:py-3 bg-gray-100">
        <Button onClick={handleReset} variant="destructive" size="sm" className="text-xs sm:text-sm">
          إعادة تعيين الكل - Reset All
        </Button>
      </div>

      {lastCheckedAyah && (
        <div className="px-4 py-3 sm:px-6 sm:py-4" style={{ background: "linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)" }}>
          <div className="max-w-2xl mx-auto">
            <p className="text-white text-sm sm:text-base font-semibold mb-2 text-center">
              آخر آية تمت قراءتها - Last Recited Ayah:
            </p>
            <div className="bg-white rounded-lg p-3 sm:p-4 flex items-center gap-3" dir="rtl">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)" }}
              >
                {lastCheckedAyah}
              </div>
              <p className="text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Scheherazade New', serif" }}>
                {getAyahText(lastCheckedAyah)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-white">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-2 sm:space-y-3">
          {AYAH_DATA.map((ayah) => (
            <div
              key={ayah.number}
              ref={(el) => { ayahRefs.current[ayah.number] = el; }}
              className={`p-3 sm:p-4 rounded-lg flex items-center gap-3 transition-all ${
                progress[ayah.number]
                  ? "bg-indigo-100 border-r-4 border-indigo-600"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              dir="rtl"
            >
              <Checkbox
                checked={!!progress[ayah.number]}
                onCheckedChange={(checked) => handleCheckAyah(ayah.number, checked as boolean)}
                className="w-6 h-6 border-2 border-indigo-600 data-[state=checked]:bg-indigo-600"
              />
              <span className="w-10 sm:w-12 text-center font-bold text-gray-700 shrink-0">
                {ayah.number}
              </span>
              <p 
                className={cn("leading-loose flex-1", fontSizeClass)}
                style={{ fontFamily: "'Scheherazade New', serif", lineHeight: "2.2" }}
              >
                {getAyahText(ayah.number)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SurahMulk;
