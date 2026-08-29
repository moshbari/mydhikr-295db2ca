import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { useSurahFontSize } from "@/hooks/use-surah-font-size";
import { FontSizeSelector } from "@/components/surah/FontSizeSelector";
import { FloatingVoiceAyahSearch } from "@/components/surah/FloatingVoiceAyahSearch";

// Ayah data for Surah Waqiah (96 Ayahs)
const AYAH_DATA = [
  { number: 1, text: "إِذَا وَقَعَتِ ٱلْوَاقِعَةُ" },
  { number: 2, text: "لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ" },
  { number: 3, text: "خَافِضَةٌۭ رَّافِعَةٌ" },
  { number: 4, text: "إِذَا رُجَّتِ ٱلْأَرْضُ رَجًّۭا" },
  { number: 5, text: "وَبُسَّتِ ٱلْجِبَالُ بَسًّۭا" },
  { number: 6, text: "فَكَانَتْ هَبَآءًۭ مُّنۢبَثًّۭا" },
  { number: 7, text: "وَكُنتُمْ أَزْوَٰجًۭا ثَلَٰثَةًۭ" },
  { number: 8, text: "فَأَصْحَٰبُ ٱلْمَيْمَنَةِ مَآ أَصْحَٰبُ ٱلْمَيْمَنَةِ" },
  { number: 9, text: "وَأَصْحَٰبُ ٱلْمَشْـَٔمَةِ مَآ أَصْحَٰبُ ٱلْمَشْـَٔمَةِ" },
  { number: 10, text: "وَٱلسَّٰبِقُونَ ٱلسَّٰبِقُونَ" },
  { number: 11, text: "أُو۟لَٰٓئِكَ ٱلْمُقَرَّبُونَ" },
  { number: 12, text: "فِى جَنَّٰتِ ٱلنَّعِيمِ" },
  { number: 13, text: "ثُلَّةٌۭ مِّنَ ٱلْأَوَّلِينَ" },
  { number: 14, text: "وَقَلِيلٌۭ مِّنَ ٱلْءَاخِرِينَ" },
  { number: 15, text: "عَلَىٰ سُرُرٍۢ مَّوْضُونَةٍۢ" },
  { number: 16, text: "مُّتَّكِـِٔينَ عَلَيْهَا مُتَقَٰبِلِينَ" },
  { number: 17, text: "يَطُوفُ عَلَيْهِمْ وِلْدَٰنٌۭ مُّخَلَّدُونَ" },
  { number: 18, text: "بِأَكْوَابٍۢ وَأَبَارِيقَ وَكَأْسٍۢ مِّن مَّعِينٍۢ" },
  { number: 19, text: "لَّا يُصَدَّعُونَ عَنْهَا وَلَا يُنزِفُونَ" },
  { number: 20, text: "وَفَٰكِهَةٍۢ مِّمَّا يَتَخَيَّرُونَ" },
  { number: 21, text: "وَلَحْمِ طَيْرٍۢ مِّمَّا يَشْتَهُونَ" },
  { number: 22, text: "وَحُورٌ عِينٌۭ" },
  { number: 23, text: "كَأَمْثَٰلِ ٱللُّؤْلُؤِ ٱلْمَكْنُونِ" },
  { number: 24, text: "جَزَآءًۢ بِمَا كَانُوا۟ يَعْمَلُونَ" },
  { number: 25, text: "لَا يَسْمَعُونَ فِيهَا لَغْوًۭا وَلَا تَأْثِيمًا" },
  { number: 26, text: "إِلَّا قِيلًۭا سَلَٰمًۭا سَلَٰمًۭا" },
  { number: 27, text: "وَأَصْحَٰبُ ٱلْيَمِينِ مَآ أَصْحَٰبُ ٱلْيَمِينِ" },
  { number: 28, text: "فِى سِدْرٍۢ مَّخْضُودٍۢ" },
  { number: 29, text: "وَطَلْحٍۢ مَّنضُودٍۢ" },
  { number: 30, text: "وَظِلٍّۢ مَّمْدُودٍۢ" },
  { number: 31, text: "وَمَآءٍۢ مَّسْكُوبٍۢ" },
  { number: 32, text: "وَفَٰكِهَةٍۢ كَثِيرَةٍۢ" },
  { number: 33, text: "لَّا مَقْطُوعَةٍۢ وَلَا مَمْنُوعَةٍۢ" },
  { number: 34, text: "وَفُرُشٍۢ مَّرْفُوعَةٍ" },
  { number: 35, text: "إِنَّآ أَنشَأْنَٰهُنَّ إِنشَآءًۭ" },
  { number: 36, text: "فَجَعَلْنَٰهُنَّ أَبْكَارًا" },
  { number: 37, text: "عُرُبًا أَتْرَابًۭا" },
  { number: 38, text: "لِّأَصْحَٰبِ ٱلْيَمِينِ" },
  { number: 39, text: "ثُلَّةٌۭ مِّنَ ٱلْأَوَّلِينَ" },
  { number: 40, text: "وَثُلَّةٌۭ مِّنَ ٱلْءَاخِرِينَ" },
  { number: 41, text: "وَأَصْحَٰبُ ٱلشِّمَالِ مَآ أَصْحَٰبُ ٱلشِّمَالِ" },
  { number: 42, text: "فِى سَمُومٍۢ وَحَمِيمٍۢ" },
  { number: 43, text: "وَظِلٍّۢ مِّن يَحْمُومٍۢ" },
  { number: 44, text: "لَّا بَارِدٍۢ وَلَا كَرِيمٍ" },
  { number: 45, text: "إِنَّهُمْ كَانُوا۟ قَبْلَ ذَٰلِكَ مُتْرَفِينَ" },
  { number: 46, text: "وَكَانُوا۟ يُصِرُّونَ عَلَى ٱلْحِنثِ ٱلْعَظِيمِ" },
  { number: 47, text: "وَكَانُوا۟ يَقُولُونَ أَئِذَا مِتْنَا وَكُنَّا تُرَابًۭا وَعِظَٰمًا أَءِنَّا لَمَبْعُوثُونَ" },
  { number: 48, text: "أَوَءَابَآؤُنَا ٱلْأَوَّلُونَ" },
  { number: 49, text: "قُلْ إِنَّ ٱلْأَوَّلِينَ وَٱلْءَاخِرِينَ" },
  { number: 50, text: "لَمَجْمُوعُونَ إِلَىٰ مِيقَٰتِ يَوْمٍۢ مَّعْلُومٍۢ" },
  { number: 51, text: "ثُمَّ إِنَّكُمْ أَيُّهَا ٱلضَّآلُّونَ ٱلْمُكَذِّبُونَ" },
  { number: 52, text: "لَءَاكِلُونَ مِن شَجَرٍۢ مِّن زَقُّومٍۢ" },
  { number: 53, text: "فَمَالِـُٔونَ مِنْهَا ٱلْبُطُونَ" },
  { number: 54, text: "فَشَٰرِبُونَ عَلَيْهِ مِنَ ٱلْحَمِيمِ" },
  { number: 55, text: "فَشَٰرِبُونَ شُرْبَ ٱلْهِيمِ" },
  { number: 56, text: "هَٰذَا نُزُلُهُمْ يَوْمَ ٱلدِّينِ" },
  { number: 57, text: "نَحْنُ خَلَقْنَٰكُمْ فَلَوْلَا تُصَدِّقُونَ" },
  { number: 58, text: "أَفَرَءَيْتُم مَّا تُمْنُونَ" },
  { number: 59, text: "ءَأَنتُمْ تَخْلُقُونَهُۥٓ أَمْ نَحْنُ ٱلْخَٰلِقُونَ" },
  { number: 60, text: "نَحْنُ قَدَّرْنَا بَيْنَكُمُ ٱلْمَوْتَ وَمَا نَحْنُ بِمَسْبُوقِينَ" },
  { number: 61, text: "عَلَىٰٓ أَن نُّبَدِّلَ أَمْثَٰلَكُمْ وَنُنشِئَكُمْ فِى مَا لَا تَعْلَمُونَ" },
  { number: 62, text: "وَلَقَدْ عَلِمْتُمُ ٱلنَّشْأَةَ ٱلْأُولَىٰ فَلَوْلَا تَذَكَّرُونَ" },
  { number: 63, text: "أَفَرَءَيْتُم مَّا تَحْرُثُونَ" },
  { number: 64, text: "ءَأَنتُمْ تَزْرَعُونَهُۥٓ أَمْ نَحْنُ ٱلزَّٰرِعُونَ" },
  { number: 65, text: "لَوْ نَشَآءُ لَجَعَلْنَٰهُ حُطَٰمًۭا فَظَلْتُمْ تَفَكَّهُونَ" },
  { number: 66, text: "إِنَّا لَمُغْرَمُونَ" },
  { number: 67, text: "بَلْ نَحْنُ مَحْرُومُونَ" },
  { number: 68, text: "أَفَرَءَيْتُمُ ٱلْمَآءَ ٱلَّذِى تَشْرَبُونَ" },
  { number: 69, text: "ءَأَنتُمْ أَنزَلْتُمُوهُ مِنَ ٱلْمُزْنِ أَمْ نَحْنُ ٱلْمُنزِلُونَ" },
  { number: 70, text: "لَوْ نَشَآءُ جَعَلْنَٰهُ أُجَاجًۭا فَلَوْلَا تَشْكُرُونَ" },
  { number: 71, text: "أَفَرَءَيْتُمُ ٱلنَّارَ ٱلَّتِى تُورُونَ" },
  { number: 72, text: "ءَأَنتُمْ أَنشَأْتُمْ شَجَرَتَهَآ أَمْ نَحْنُ ٱلْمُنشِـُٔونَ" },
  { number: 73, text: "نَحْنُ جَعَلْنَٰهَا تَذْكِرَةًۭ وَمَتَٰعًۭا لِّلْمُقْوِينَ" },
  { number: 74, text: "فَسَبِّحْ بِٱسْمِ رَبِّكَ ٱلْعَظِيمِ" },
  { number: 75, text: "فَلَآ أُقْسِمُ بِمَوَٰقِعِ ٱلنُّجُومِ" },
  { number: 76, text: "وَإِنَّهُۥ لَقَسَمٌۭ لَّوْ تَعْلَمُونَ عَظِيمٌ" },
  { number: 77, text: "إِنَّهُۥ لَقُرْءَانٌۭ كَرِيمٌۭ" },
  { number: 78, text: "فِى كِتَٰبٍۢ مَّكْنُونٍۢ" },
  { number: 79, text: "لَّا يَمَسُّهُۥٓ إِلَّا ٱلْمُطَهَّرُونَ" },
  { number: 80, text: "تَنزِيلٌۭ مِّن رَّبِّ ٱلْعَٰلَمِينَ" },
  { number: 81, text: "أَفَبِهَٰذَا ٱلْحَدِيثِ أَنتُم مُّدْهِنُونَ" },
  { number: 82, text: "وَتَجْعَلُونَ رِزْقَكُمْ أَنَّكُمْ تُكَذِّبُونَ" },
  { number: 83, text: "فَلَوْلَآ إِذَا بَلَغَتِ ٱلْحُلْقُومَ" },
  { number: 84, text: "وَأَنتُمْ حِينَئِذٍۢ تَنظُرُونَ" },
  { number: 85, text: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنكُمْ وَلَٰكِن لَّا تُبْصِرُونَ" },
  { number: 86, text: "فَلَوْلَآ إِن كُنتُمْ غَيْرَ مَدِينِينَ" },
  { number: 87, text: "تَرْجِعُونَهَآ إِن كُنتُمْ صَٰدِقِينَ" },
  { number: 88, text: "فَأَمَّآ إِن كَانَ مِنَ ٱلْمُقَرَّبِينَ" },
  { number: 89, text: "فَرَوْحٌۭ وَرَيْحَانٌۭ وَجَنَّتُ نَعِيمٍۢ" },
  { number: 90, text: "وَأَمَّآ إِن كَانَ مِنْ أَصْحَٰبِ ٱلْيَمِينِ" },
  { number: 91, text: "فَسَلَٰمٌۭ لَّكَ مِنْ أَصْحَٰبِ ٱلْيَمِينِ" },
  { number: 92, text: "وَأَمَّآ إِن كَانَ مِنَ ٱلْمُكَذِّبِينَ ٱلضَّآلِّينَ" },
  { number: 93, text: "فَنُزُلٌۭ مِّنْ حَمِيمٍۢ" },
  { number: 94, text: "وَتَصْلِيَةُ جَحِيمٍ" },
  { number: 95, text: "إِنَّ هَٰذَا لَهُوَ حَقُّ ٱلْيَقِينِ" },
  { number: 96, text: "فَسَبِّحْ بِٱسْمِ رَبِّكَ ٱلْعَظِيمِ" },
];

const TOTAL_AYAHS = 96;

const SurahWaqiah = () => {
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

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("waqiahProgress");
    const savedLastChecked = localStorage.getItem("waqiahLastCheckedAyah");
    const savedLastTime = localStorage.getItem("waqiahLastSaveTime");
    
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    if (savedLastChecked) {
      setLastCheckedAyah(parseInt(savedLastChecked));
    }
    if (savedLastTime) {
      setLastSaveTime(savedLastTime);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("waqiahProgress", JSON.stringify(progress));
    if (lastCheckedAyah !== null) {
      localStorage.setItem("waqiahLastCheckedAyah", lastCheckedAyah.toString());
      const now = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      setLastSaveTime(now);
      localStorage.setItem("waqiahLastSaveTime", now);
    }
  }, [progress, lastCheckedAyah]);

  const getAyahText = (ayahNumber: number) => {
    const ayah = AYAH_DATA.find(a => a.number === ayahNumber);
    if (!ayah) return "";
    const words = ayah.text.split(" ");
    if (words.length <= 8) return ayah.text;
    return `${words.slice(0, 4).join(" ")} ... ${words.slice(-4).join(" ")}`;
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TOTAL_AYAHS) * 100);

  const handleCheckAyah = async (ayahNumber: number, checked: boolean) => {
    await haptics.light();
    
    if (checked) {
      sounds.add();
      setProgress(prev => ({ ...prev, [ayahNumber]: true }));
      setLastCheckedAyah(ayahNumber);
    } else {
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[ayahNumber];
        return newProgress;
      });
      
      // Find the highest remaining checked ayah
      const remainingChecked = Object.keys(progress)
        .map(Number)
        .filter(n => n !== ayahNumber && progress[n]);
      
      if (remainingChecked.length > 0) {
        setLastCheckedAyah(Math.max(...remainingChecked));
      } else {
        setLastCheckedAyah(null);
        localStorage.removeItem("waqiahLastCheckedAyah");
      }
    }
  };

  const handleReset = async () => {
    await haptics.warning();
    if (window.confirm("Are you sure you want to reset all progress?")) {
      await haptics.heavy();
      sounds.delete();
      setProgress({});
      setLastCheckedAyah(null);
      setLastSaveTime(null);
      localStorage.removeItem("waqiahProgress");
      localStorage.removeItem("waqiahLastCheckedAyah");
      localStorage.removeItem("waqiahLastSaveTime");
    }
  };

  const lastCheckedAyahData = lastCheckedAyah 
    ? AYAH_DATA.find(a => a.number === lastCheckedAyah) 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Header with Back Button, Surah Name, Last Recited */}
      <div className="sticky top-0 z-10 safe-top">
        {/* Header with Back Button */}
        <div 
          className="py-3 px-4 md:py-4 md:px-6 relative"
          style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}
        >
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 absolute left-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="text-center">
              <h1 
                className="text-xl md:text-2xl font-bold text-white"
                style={{ fontFamily: "'Scheherazade New', serif" }}
              >
                سورة الواقعة
              </h1>
              <p className="text-white/80 text-xs md:text-sm">Surah Al-Waqiah - 96 Ayahs</p>
            </div>
          </div>
        </div>

        {/* Last Recited Ayah Section - Right after surah name */}
        {lastCheckedAyahData && (
          <div 
            className="px-4 md:px-6 py-3"
            style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}
          >
            <p className="text-white text-xs md:text-sm font-semibold mb-2 text-center">
              آخر آية تمت قراءتها - Last Recited Ayah:
            </p>
            <div 
              className="bg-white rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors" 
              dir="rtl"
              onClick={() => scrollToAyah(lastCheckedAyahData.number)}
            >
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}
              >
                <span className="text-white font-bold text-sm md:text-base">{lastCheckedAyahData.number}</span>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ fontFamily: "'Scheherazade New', serif" }}
              >
                {getAyahText(lastCheckedAyahData.number)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Font Size Selector */}
      <FontSizeSelector 
        fontSize={fontSize} 
        onFontSizeChange={handleFontSizeChange}
        accentColor="#1e3c72"
      />

      {/* Progress Bar Section */}
      <div className="bg-[#f8f9fa] px-4 py-2 md:px-6 md:py-3 border-t border-gray-200">
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #11998e 0%, #38ef7d 100%)"
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-semibold text-gray-700">
            {completedCount} / {TOTAL_AYAHS} ({progressPercent}%)
          </span>
        </div>
        {lastSaveTime && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Last saved: {lastSaveTime}
          </p>
        )}
      </div>

      {/* Reset Button */}
      <div className="flex justify-center py-2 bg-[#f8f9fa]">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReset}
          className="text-xs md:text-sm"
        >
          إعادة تعيين الكل - Reset All
        </Button>
      </div>

      {/* Ayah List */}
      <div className="flex-1 px-4 md:px-6 pb-24 safe-bottom bg-white">
          <div className="space-y-2 md:space-y-3">
            {AYAH_DATA.map((ayah) => {
              const isChecked = progress[ayah.number] || false;
              return (
                <div
                  key={ayah.number}
                  ref={(el) => { ayahRefs.current[ayah.number] = el; }}
                  className={cn(
                    "p-3 md:p-4 rounded-lg transition-all duration-200 flex items-center gap-3",
                    isChecked 
                      ? "bg-green-100 border-r-4 border-green-500" 
                      : "bg-[#f8f9fa] hover:bg-gray-200"
                  )}
                  dir="rtl"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleCheckAyah(ayah.number, checked as boolean)}
                    className="w-6 h-6 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <span className="font-bold text-lg md:text-xl min-w-[40px] text-center">
                    {ayah.number}
                  </span>
                  <p 
                    className={cn("flex-1 leading-loose", fontSizeClass)}
                    style={{ fontFamily: "'Scheherazade New', serif", lineHeight: 2.2 }}
                  >
                    {getAyahText(ayah.number)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      <FloatingVoiceAyahSearch
        ayahs={AYAH_DATA}
        onAyahFound={handleVoiceAyahFound}
        accentColor="#1e3c72"
      />
    </div>
  );
};

export default SurahWaqiah;