import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const FONT_SIZES = [
  { label: "S", value: "text-base", size: 16 },
  { label: "M", value: "text-lg", size: 18 },
  { label: "L", value: "text-xl", size: 20 },
  { label: "XL", value: "text-2xl", size: 24 },
];

// Ayah data for Surah Waqiah (96 Ayahs)
const AYAH_DATA = [
  { number: 1, first: "إِذَا وَقَعَتِ ٱلۡوَاقِعَةُ", last: "ٱلۡوَاقِعَةُ" },
  { number: 2, first: "لَيۡسَ لِوَقۡعَتِهَا كَاذِبَةٌ", last: "كَاذِبَةٌ" },
  { number: 3, first: "خَافِضَةٞ رَّافِعَةٌ", last: "رَّافِعَةٌ" },
  { number: 4, first: "إِذَا رُجَّتِ ٱلۡأَرۡضُ رَجّٗا", last: "رَجّٗا" },
  { number: 5, first: "وَبُسَّتِ ٱلۡجِبَالُ بَسّٗا", last: "بَسّٗا" },
  { number: 6, first: "فَكَانَتۡ هَبَآءٗ مُّنۢبَثّٗا", last: "مُّنۢبَثّٗا" },
  { number: 7, first: "وَكُنتُمۡ أَزۡوَٰجٗا ثَلَٰثَةٗ", last: "ثَلَٰثَةٗ" },
  { number: 8, first: "فَأَصۡحَٰبُ ٱلۡمَيۡمَنَةِ مَآ أَصۡحَٰبُ", last: "ٱلۡمَيۡمَنَةِ" },
  { number: 9, first: "وَأَصۡحَٰبُ ٱلۡمَشۡـَٔمَةِ مَآ أَصۡحَٰبُ", last: "ٱلۡمَشۡـَٔمَةِ" },
  { number: 10, first: "وَٱلسَّٰبِقُونَ ٱلسَّٰبِقُونَ", last: "ٱلسَّٰبِقُونَ" },
  { number: 11, first: "أُوْلَٰٓئِكَ ٱلۡمُقَرَّبُونَ", last: "ٱلۡمُقَرَّبُونَ" },
  { number: 12, first: "فِي جَنَّٰتِ ٱلنَّعِيمِ", last: "ٱلنَّعِيمِ" },
  { number: 13, first: "ثُلَّةٞ مِّنَ ٱلۡأَوَّلِينَ", last: "ٱلۡأَوَّلِينَ" },
  { number: 14, first: "وَقَلِيلٞ مِّنَ ٱلۡأٓخِرِينَ", last: "ٱلۡأٓخِرِينَ" },
  { number: 15, first: "عَلَىٰ سُرُرٖ مَّوۡضُونَةٖ", last: "مَّوۡضُونَةٖ" },
  { number: 16, first: "مُّتَّكِـِٔينَ عَلَيۡهَا مُتَقَٰبِلِينَ", last: "مُتَقَٰبِلِينَ" },
  { number: 17, first: "يَطُوفُ عَلَيۡهِمۡ وِلۡدَٰنٞ مُّخَلَّدُونَ", last: "مُّخَلَّدُونَ" },
  { number: 18, first: "بِأَكۡوَابٖ وَأَبَارِيقَ وَكَأۡسٖ", last: "مَّعِينٖ" },
  { number: 19, first: "لَّا يُصَدَّعُونَ عَنۡهَا وَلَا", last: "يُنزِفُونَ" },
  { number: 20, first: "وَفَٰكِهَةٖ مِّمَّا يَتَخَيَّرُونَ", last: "يَتَخَيَّرُونَ" },
  { number: 21, first: "وَلَحۡمِ طَيۡرٖ مِّمَّا يَشۡتَهُونَ", last: "يَشۡتَهُونَ" },
  { number: 22, first: "وَحُورٌ عِينٞ", last: "عِينٞ" },
  { number: 23, first: "كَأَمۡثَٰلِ ٱللُّؤۡلُؤِ ٱلۡمَكۡنُونِ", last: "ٱلۡمَكۡنُونِ" },
  { number: 24, first: "جَزَآءَۢ بِمَا كَانُواْ يَعۡمَلُونَ", last: "يَعۡمَلُونَ" },
  { number: 25, first: "لَا يَسۡمَعُونَ فِيهَا لَغۡوٗا", last: "تَأۡثِيمًا" },
  { number: 26, first: "إِلَّا قِيلٗا سَلَٰمٗا سَلَٰمٗا", last: "سَلَٰمٗا" },
  { number: 27, first: "وَأَصۡحَٰبُ ٱلۡيَمِينِ مَآ أَصۡحَٰبُ", last: "ٱلۡيَمِينِ" },
  { number: 28, first: "فِي سِدۡرٖ مَّخۡضُودٖ", last: "مَّخۡضُودٖ" },
  { number: 29, first: "وَطَلۡحٖ مَّنضُودٖ", last: "مَّنضُودٖ" },
  { number: 30, first: "وَظِلّٖ مَّمۡدُودٖ", last: "مَّمۡدُودٖ" },
  { number: 31, first: "وَمَآءٖ مَّسۡكُوبٖ", last: "مَّسۡكُوبٖ" },
  { number: 32, first: "وَفَٰكِهَةٖ كَثِيرَةٖ", last: "كَثِيرَةٖ" },
  { number: 33, first: "لَّا مَقۡطُوعَةٖ وَلَا مَمۡنُوعَةٖ", last: "مَمۡنُوعَةٖ" },
  { number: 34, first: "وَفُرُشٖ مَّرۡفُوعَةٍ", last: "مَّرۡفُوعَةٍ" },
  { number: 35, first: "إِنَّآ أَنشَأۡنَٰهُنَّ إِنشَآءٗ", last: "إِنشَآءٗ" },
  { number: 36, first: "فَجَعَلۡنَٰهُنَّ أَبۡكَارًا", last: "أَبۡكَارًا" },
  { number: 37, first: "عُرُبًا أَتۡرَابٗا", last: "أَتۡرَابٗا" },
  { number: 38, first: "لِّأَصۡحَٰبِ ٱلۡيَمِينِ", last: "ٱلۡيَمِينِ" },
  { number: 39, first: "ثُلَّةٞ مِّنَ ٱلۡأَوَّلِينَ", last: "ٱلۡأَوَّلِينَ" },
  { number: 40, first: "وَثُلَّةٞ مِّنَ ٱلۡأٓخِرِينَ", last: "ٱلۡأٓخِرِينَ" },
  { number: 41, first: "وَأَصۡحَٰبُ ٱلشِّمَالِ مَآ أَصۡحَٰبُ", last: "ٱلشِّمَالِ" },
  { number: 42, first: "فِي سَمُومٖ وَحَمِيمٖ", last: "وَحَمِيمٖ" },
  { number: 43, first: "وَظِلّٖ مِّن يَحۡمُومٖ", last: "يَحۡمُومٖ" },
  { number: 44, first: "لَّا بَارِدٖ وَلَا كَرِيمٖ", last: "كَرِيمٖ" },
  { number: 45, first: "إِنَّهُمۡ كَانُواْ قَبۡلَ ذَٰلِكَ", last: "مُتۡرَفِينَ" },
  { number: 46, first: "وَكَانُواْ يُصِرُّونَ عَلَى ٱلۡحِنثِ", last: "ٱلۡعَظِيمِ" },
  { number: 47, first: "وَكَانُواْ يَقُولُونَ أَئِذَا مِتۡنَا", last: "لَمَبۡعُوثُونَ" },
  { number: 48, first: "أَوَءَابَآؤُنَا ٱلۡأَوَّلُونَ", last: "ٱلۡأَوَّلُونَ" },
  { number: 49, first: "قُلۡ إِنَّ ٱلۡأَوَّلِينَ وَٱلۡأٓخِرِينَ", last: "وَٱلۡأٓخِرِينَ" },
  { number: 50, first: "لَمَجۡمُوعُونَ إِلَىٰ مِيقَٰتِ يَوۡمٖ", last: "مَّعۡلُومٖ" },
  { number: 51, first: "ثُمَّ إِنَّكُمۡ أَيُّهَا ٱلضَّآلُّونَ", last: "ٱلۡمُكَذِّبُونَ" },
  { number: 52, first: "لَأٓكِلُونَ مِن شَجَرٖ مِّن", last: "زَقُّومٖ" },
  { number: 53, first: "فَمَالِـُٔونَ مِنۡهَا ٱلۡبُطُونَ", last: "ٱلۡبُطُونَ" },
  { number: 54, first: "فَشَٰرِبُونَ عَلَيۡهِ مِنَ ٱلۡحَمِيمِ", last: "ٱلۡحَمِيمِ" },
  { number: 55, first: "فَشَٰرِبُونَ شُرۡبَ ٱلۡهِيمِ", last: "ٱلۡهِيمِ" },
  { number: 56, first: "هَٰذَا نُزُلُهُمۡ يَوۡمَ ٱلدِّينِ", last: "ٱلدِّينِ" },
  { number: 57, first: "نَحۡنُ خَلَقۡنَٰكُمۡ فَلَوۡلَا تُصَدِّقُونَ", last: "تُصَدِّقُونَ" },
  { number: 58, first: "أَفَرَءَيۡتُم مَّا تُمۡنُونَ", last: "تُمۡنُونَ" },
  { number: 59, first: "ءَأَنتُمۡ تَخۡلُقُونَهُۥٓ أَمۡ نَحۡنُ", last: "ٱلۡخَٰلِقُونَ" },
  { number: 60, first: "نَحۡنُ قَدَّرۡنَا بَيۡنَكُمُ ٱلۡمَوۡتَ", last: "بِمَسۡبُوقِينَ" },
  { number: 61, first: "عَلَىٰٓ أَن نُّبَدِّلَ أَمۡثَٰلَكُمۡ", last: "تَعۡلَمُونَ" },
  { number: 62, first: "وَلَقَدۡ عَلِمۡتُمُ ٱلنَّشۡأَةَ ٱلۡأُولَىٰ", last: "تَذَكَّرُونَ" },
  { number: 63, first: "أَفَرَءَيۡتُم مَّا تَحۡرُثُونَ", last: "تَحۡرُثُونَ" },
  { number: 64, first: "ءَأَنتُمۡ تَزۡرَعُونَهُۥٓ أَمۡ نَحۡنُ", last: "ٱلزَّٰرِعُونَ" },
  { number: 65, first: "لَوۡ نَشَآءُ لَجَعَلۡنَٰهُ حُطَٰمٗا", last: "تَفَكَّهُونَ" },
  { number: 66, first: "إِنَّا لَمُغۡرَمُونَ", last: "لَمُغۡرَمُونَ" },
  { number: 67, first: "بَلۡ نَحۡنُ مَحۡرُومُونَ", last: "مَحۡرُومُونَ" },
  { number: 68, first: "أَفَرَءَيۡتُمُ ٱلۡمَآءَ ٱلَّذِي تَشۡرَبُونَ", last: "تَشۡرَبُونَ" },
  { number: 69, first: "ءَأَنتُمۡ أَنزَلۡتُمُوهُ مِنَ ٱلۡمُزۡنِ", last: "ٱلۡمُنزِلُونَ" },
  { number: 70, first: "لَوۡ نَشَآءُ جَعَلۡنَٰهُ أُجَاجٗا", last: "تَشۡكُرُونَ" },
  { number: 71, first: "أَفَرَءَيۡتُمُ ٱلنَّارَ ٱلَّتِي تُورُونَ", last: "تُورُونَ" },
  { number: 72, first: "ءَأَنتُمۡ أَنشَأۡتُمۡ شَجَرَتَهَآ أَمۡ", last: "ٱلۡمُنشِـُٔونَ" },
  { number: 73, first: "نَحۡنُ جَعَلۡنَٰهَا تَذۡكِرَةٗ وَمَتَٰعٗا", last: "لِّلۡمُقۡوِينَ" },
  { number: 74, first: "فَسَبِّحۡ بِٱسۡمِ رَبِّكَ ٱلۡعَظِيمِ", last: "ٱلۡعَظِيمِ" },
  { number: 75, first: "فَلَآ أُقۡسِمُ بِمَوَٰقِعِ ٱلنُّجُومِ", last: "ٱلنُّجُومِ" },
  { number: 76, first: "وَإِنَّهُۥ لَقَسَمٞ لَّوۡ تَعۡلَمُونَ", last: "عَظِيمٌ" },
  { number: 77, first: "إِنَّهُۥ لَقُرۡءَانٞ كَرِيمٞ", last: "كَرِيمٞ" },
  { number: 78, first: "فِي كِتَٰبٖ مَّكۡنُونٖ", last: "مَّكۡنُونٖ" },
  { number: 79, first: "لَّا يَمَسُّهُۥٓ إِلَّا ٱلۡمُطَهَّرُونَ", last: "ٱلۡمُطَهَّرُونَ" },
  { number: 80, first: "تَنزِيلٞ مِّن رَّبِّ ٱلۡعَٰلَمِينَ", last: "ٱلۡعَٰلَمِينَ" },
  { number: 81, first: "أَفَبِهَٰذَا ٱلۡحَدِيثِ أَنتُم مُّدۡهِنُونَ", last: "مُّدۡهِنُونَ" },
  { number: 82, first: "وَتَجۡعَلُونَ رِزۡقَكُمۡ أَنَّكُمۡ تُكَذِّبُونَ", last: "تُكَذِّبُونَ" },
  { number: 83, first: "فَلَوۡلَآ إِذَا بَلَغَتِ ٱلۡحُلۡقُومَ", last: "ٱلۡحُلۡقُومَ" },
  { number: 84, first: "وَأَنتُمۡ حِينَئِذٖ تَنظُرُونَ", last: "تَنظُرُونَ" },
  { number: 85, first: "وَنَحۡنُ أَقۡرَبُ إِلَيۡهِ مِنكُمۡ", last: "تُبۡصِرُونَ" },
  { number: 86, first: "فَلَوۡلَآ إِن كُنتُمۡ غَيۡرَ", last: "مَدِينِينَ" },
  { number: 87, first: "تَرۡجِعُونَهَآ إِن كُنتُمۡ صَٰدِقِينَ", last: "صَٰدِقِينَ" },
  { number: 88, first: "فَأَمَّآ إِن كَانَ مِنَ", last: "ٱلۡمُقَرَّبِينَ" },
  { number: 89, first: "فَرَوۡحٞ وَرَيۡحَانٞ وَجَنَّتُ نَعِيمٖ", last: "نَعِيمٖ" },
  { number: 90, first: "وَأَمَّآ إِن كَانَ مِنۡ أَصۡحَٰبِ", last: "ٱلۡيَمِينِ" },
  { number: 91, first: "فَسَلَٰمٞ لَّكَ مِنۡ أَصۡحَٰبِ", last: "ٱلۡيَمِينِ" },
  { number: 92, first: "وَأَمَّآ إِن كَانَ مِنَ ٱلۡمُكَذِّبِينَ", last: "ٱلضَّآلِّينَ" },
  { number: 93, first: "فَنُزُلٞ مِّنۡ حَمِيمٖ", last: "حَمِيمٖ" },
  { number: 94, first: "وَتَصۡلِيَةُ جَحِيمٍ", last: "جَحِيمٍ" },
  { number: 95, first: "إِنَّ هَٰذَا لَهُوَ حَقُّ ٱلۡيَقِينِ", last: "ٱلۡيَقِينِ" },
  { number: 96, first: "فَسَبِّحۡ بِٱسۡمِ رَبِّكَ ٱلۡعَظِيمِ", last: "ٱلۡعَظِيمِ" }
];

const TOTAL_AYAHS = 96;

const SurahWaqiah = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, boolean>>({});
  const [lastCheckedAyah, setLastCheckedAyah] = useState<number | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(1); // Index into FONT_SIZES

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("waqiahProgress");
    const savedLastChecked = localStorage.getItem("waqiahLastCheckedAyah");
    const savedLastTime = localStorage.getItem("waqiahLastSaveTime");
    const savedFontSize = localStorage.getItem("waqiahFontSize");
    
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    if (savedLastChecked) {
      setLastCheckedAyah(parseInt(savedLastChecked));
    }
    if (savedLastTime) {
      setLastSaveTime(savedLastTime);
    }
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }
  }, []);

  const handleFontSizeChange = (index: number) => {
    setFontSize(index);
    localStorage.setItem("waqiahFontSize", index.toString());
    haptics.light();
  };

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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Back Button */}
      <div className="p-4 safe-top">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white md:rounded-t-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div 
          className="text-center py-5 px-4 md:py-7 md:px-6 md:rounded-t-3xl"
          style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}
        >
          <h1 
            className="text-2xl md:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: "'Scheherazade New', serif" }}
          >
            سورة الواقعة
          </h1>
          <p className="text-white/80 text-sm md:text-base">Surah Al-Waqiah - 96 Ayahs</p>
        </div>

        {/* Font Size Selector */}
        <div className="bg-[#f8f9fa] px-4 py-3 md:px-6 md:py-4 flex items-center justify-center gap-2">
          <Type className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Font:</span>
          <div className="flex gap-1">
            {FONT_SIZES.map((size, index) => (
              <button
                key={size.label}
                onClick={() => handleFontSizeChange(index)}
                className={cn(
                  "w-8 h-8 rounded-md text-sm font-medium transition-all",
                  fontSize === index
                    ? "bg-[#1e3c72] text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

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
        <div className="flex justify-center py-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            className="text-xs md:text-sm"
          >
            إعادة تعيين الكل - Reset All
          </Button>
        </div>

        {/* Last Recited Ayah Section */}
        {lastCheckedAyahData && (
          <div 
            className="mx-4 md:mx-6 mb-4 p-3 md:p-4 rounded-xl"
            style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}
          >
            <p className="text-white text-xs md:text-sm font-semibold mb-2 text-center">
              آخر آية تمت قراءتها - Last Recited Ayah:
            </p>
            <div className="bg-white rounded-lg p-3 flex items-center gap-3" dir="rtl">
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
                {lastCheckedAyahData.first} ... {lastCheckedAyahData.last}
              </p>
            </div>
          </div>
        )}

        {/* Ayah List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 safe-bottom">
          <div className="space-y-2 md:space-y-3">
            {AYAH_DATA.map((ayah) => {
              const isChecked = progress[ayah.number] || false;
              return (
                <div
                  key={ayah.number}
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
                    className={cn("flex-1 leading-loose", FONT_SIZES[fontSize].value)}
                    style={{ fontFamily: "'Scheherazade New', serif", lineHeight: 2.2 }}
                  >
                    {ayah.first} ... {ayah.last}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahWaqiah;