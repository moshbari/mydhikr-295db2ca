import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

// Ayah data for Surah Yasin
const AYAH_DATA = [
  { number: 1, first: "يٰسٓ وَٱلۡقُرۡءَانِ ٱلۡحَكِيمِ", last: "وَٱلۡقُرۡءَانِ ٱلۡحَكِيمِ" },
  { number: 2, first: "وَٱلۡقُرۡءَانِ ٱلۡحَكِيمِ إِنَّكَ", last: "لَمِنَ ٱلۡمُرۡسَلِينَ" },
  { number: 3, first: "إِنَّكَ لَمِنَ ٱلۡمُرۡسَلِينَ", last: "لَمِنَ ٱلۡمُرۡسَلِينَ" },
  { number: 4, first: "عَلَىٰ صِرَٰطٖ مُّسۡتَقِيمٖ", last: "صِرَٰطٖ مُّسۡتَقِيمٖ" },
  { number: 5, first: "تَنزِيلَ ٱلۡعَزِيزِ ٱلرَّحِيمِ", last: "ٱلۡعَزِيزِ ٱلرَّحِيمِ" },
  { number: 6, first: "لِتُنذِرَ قَوۡمٗا مَّآ أُنذِرَ", last: "فَهُمۡ غَٰفِلُونَ" },
  { number: 7, first: "لَقَدۡ حَقَّ ٱلۡقَوۡلُ عَلَىٰٓ", last: "فَهُمۡ لَا يُؤۡمِنُونَ" },
  { number: 8, first: "إِنَّا جَعَلۡنَا فِيٓ أَعۡنَٰقِهِمۡ", last: "فَهُم مُّقۡمَحُونَ" },
  { number: 9, first: "وَجَعَلۡنَا مِنۢ بَيۡنِ أَيۡدِيهِمۡ", last: "فَهُمۡ لَا يُبۡصِرُونَ" },
  { number: 10, first: "وَسَوَآءٌ عَلَيۡهِمۡ ءَأَنذَرۡتَهُمۡ", last: "هُمۡ لَا يُؤۡمِنُونَ" },
  { number: 11, first: "إِنَّمَا تُنذِرُ مَنِ ٱتَّبَعَ", last: "وَأَجۡرٖ كَرِيمٍ" },
  { number: 12, first: "إِنَّا نَحۡنُ نُحۡيِ ٱلۡمَوۡتَىٰ", last: "فِيٓ إِمَامٖ مُّبِينٖ" },
  { number: 13, first: "وَٱضۡرِبۡ لَهُم مَّثَلًا أَصۡحَٰبَ", last: "إِذۡ جَآءَهَا ٱلۡمُرۡسَلُونَ" },
  { number: 14, first: "إِذۡ أَرۡسَلۡنَآ إِلَيۡهِمُ ٱثۡنَيۡنِ", last: "إِنَّآ إِلَيۡكُم مُّرۡسَلُونَ" },
  { number: 15, first: "قَالُوٓاْ مَآ أَنتُمۡ إِلَّا", last: "إِنَّآ إِلَيۡكُم مُّرۡسَلُونَ" },
  { number: 16, first: "قَالُواْ رَبُّنَا يَعۡلَمُ إِنَّآ", last: "ٱلۡبَلَٰغُ ٱلۡمُبِينُ" },
  { number: 17, first: "وَمَا عَلَيۡنَآ إِلَّا ٱلۡبَلَٰغُ", last: "إِلَّا ٱلۡبَلَٰغُ ٱلۡمُبِينُ" },
  { number: 18, first: "قَالُوٓاْ إِنَّا تَطَيَّرۡنَا بِكُمۡۖ", last: "عَذَابٌ أَلِيمٞ" },
  { number: 19, first: "قَالُواْ طَٰٓئِرُكُم مَّعَكُمۡ أَئِن", last: "أَنتُم قَوۡمٞ مُّسۡرِفُونَ" },
  { number: 20, first: "وَجَآءَ مِنۡ أَقۡصَا ٱلۡمَدِينَةِ", last: "رَجُلٞ يَسۡعَىٰ" },
  { number: 21, first: "ٱتَّبِعُواْ مَن لَّا يَسۡـَٔلُكُمۡ", last: "وَهُم مُّهۡتَدُونَ" },
  { number: 22, first: "وَمَا لِيَ لَآ أَعۡبُدُ", last: "وَإِلَيۡهِ تُرۡجَعُونَ" },
  { number: 23, first: "ءَأَتَّخِذُ مِن دُونِهِۦٓ ءَالِهَةً", last: "فِي ضَلَٰلٖ مُّبِينٍ" },
  { number: 24, first: "إِنِّيٓ ءَامَنتُ بِرَبِّكُمۡ فَٱسۡمَعُونِ", last: "مِنَ ٱلۡمُؤۡمِنِينَ" },
  { number: 25, first: "قِيلَ ٱدۡخُلِ ٱلۡجَنَّةَۖ قَالَ", last: "بِمَا يَعۡلَمُونَ" },
  { number: 26, first: "قَالَ يَٰلَيۡتَ قَوۡمِي يَعۡلَمُونَ", last: "مِنَ ٱلۡمُكۡرَمِينَ" },
  { number: 27, first: "وَمَآ أَنزَلۡنَا عَلَىٰ قَوۡمِهِۦ", last: "كُنَّا مُنزِلِينَ" },
  { number: 28, first: "إِن كَانَتۡ إِلَّا صَيۡحَةٗ", last: "إِذَا هُمۡ خَٰمِدُونَ" },
  { number: 29, first: "يَٰحَسۡرَةً عَلَى ٱلۡعِبَادِۚ مَا", last: "كَانُواْ بِهِۦ يَسۡتَهۡزِءُونَ" },
  { number: 30, first: "أَلَمۡ يَرَوۡاْ كَمۡ أَهۡلَكۡنَا", last: "إِلَيۡهِمۡ لَا يَرۡجِعُونَ" },
  { number: 31, first: "وَإِن كُلٌّ لَّمَّا جَمِيعٞ", last: "لَّدَيۡنَا مُحۡضَرُونَ" },
  { number: 32, first: "وَإِن كُلّٞ لَّمَّا جَمِيعٞ", last: "لَّدَيۡنَا مُحۡضَرُونَ" },
  { number: 33, first: "وَءَايَةٞ لَّهُمُ ٱلۡأَرۡضُ ٱلۡمَيۡتَةُ", last: "وَمِنۡهُ يَأۡكُلُونَ" },
  { number: 34, first: "وَجَعَلۡنَا فِيهَا جَنَّٰتٖ مِّن", last: "أَفَلَا يَشۡكُرُونَ" },
  { number: 35, first: "لِيَأۡكُلُواْ مِن ثَمَرِهِۦ وَمَا", last: "أَفَلَا يَشۡكُرُونَ" },
  { number: 36, first: "سُبۡحَٰنَ ٱلَّذِي خَلَقَ ٱلۡأَزۡوَٰجَ", last: "وَمِمَّا لَا يَعۡلَمُونَ" },
  { number: 37, first: "وَءَايَةٞ لَّهُمُ ٱلَّيۡلُ نَسۡلَخُ", last: "فَإِذَا هُم مُّظۡلِمُونَ" },
  { number: 38, first: "وَٱلشَّمۡسُ تَجۡرِي لِمُسۡتَقَرّٖ لَّهَاۚ", last: "ٱلۡعَزِيزِ ٱلۡعَلِيمِ" },
  { number: 39, first: "وَٱلۡقَمَرَ قَدَّرۡنَٰهُ مَنَازِلَ حَتَّىٰ", last: "كَٱلۡعُرۡجُونِ ٱلۡقَدِيمِ" },
  { number: 40, first: "لَا ٱلشَّمۡسُ يَنۢبَغِي لَهَآ", last: "فِي فَلَكٖ يَسۡبَحُونَ" },
  { number: 41, first: "وَءَايَةٞ لَّهُمۡ أَنَّا حَمَلۡنَا", last: "فِي ٱلۡفُلۡكِ ٱلۡمَشۡحُونِ" },
  { number: 42, first: "وَخَلَقۡنَا لَهُم مِّن مِّثۡلِهِۦ", last: "مَا يَرۡكَبُونَ" },
  { number: 43, first: "وَإِن نَّشَأۡ نُغۡرِقۡهُمۡ فَلَا", last: "وَلَا هُمۡ يُنقَذُونَ" },
  { number: 44, first: "إِلَّا رَحۡمَةٗ مِّنَّا وَمَتَٰعًا", last: "إِلَىٰ حِينٖ" },
  { number: 45, first: "وَإِذَا قِيلَ لَهُمُ ٱتَّقُواْ", last: "وَلَعَلَّكُمۡ تُرۡحَمُونَ" },
  { number: 46, first: "وَمَا تَأۡتِيهِم مِّنۡ ءَايَةٖ", last: "عَنۡهَا مُعۡرِضِينَ" },
  { number: 47, first: "وَإِذَا قِيلَ لَهُمۡ أَنفِقُواْ", last: "فِي ضَلَٰلٖ مُّبِينٖ" },
  { number: 48, first: "وَيَقُولُونَ مَتَىٰ هَٰذَا ٱلۡوَعۡدُ", last: "إِن كُنتُمۡ صَٰدِقِينَ" },
  { number: 49, first: "مَا يَنظُرُونَ إِلَّا صَيۡحَةٗ", last: "وَهُمۡ يَخِصِّمُونَ" },
  { number: 50, first: "فَلَا يَسۡتَطِيعُونَ تَوۡصِيَةٗ وَلَآ", last: "أَهۡلِهِمۡ يَرۡجِعُونَ" },
  { number: 51, first: "وَنُفِخَ فِي ٱلصُّورِ فَإِذَا", last: "رَبِّهِمۡ يَنسِلُونَ" },
  { number: 52, first: "قَالُواْ يَٰوَيۡلَنَا مَنۢ بَعَثَنَا", last: "وَصَدَقَ ٱلۡمُرۡسَلُونَ" },
  { number: 53, first: "إِن كَانَتۡ إِلَّا صَيۡحَةٗ", last: "لَّدَيۡنَا مُحۡضَرُونَ" },
  { number: 54, first: "فَٱلۡيَوۡمَ لَا تُظۡلَمُ نَفۡسٞ", last: "مَا كُنتُمۡ تَعۡمَلُونَ" },
  { number: 55, first: "إِنَّ أَصۡحَٰبَ ٱلۡجَنَّةِ ٱلۡيَوۡمَ", last: "فِي شُغُلٖ فَٰكِهُونَ" },
  { number: 56, first: "هُمۡ وَأَزۡوَٰجُهُمۡ فِي ظِلَٰلٍ", last: "ٱلۡأَرَآئِكِ مُتَّكِـُٔونَ" },
  { number: 57, first: "لَهُمۡ فِيهَا فَٰكِهَةٞ وَلَهُم", last: "مَّا يَدَّعُونَ" },
  { number: 58, first: "سَلَٰمٞ قَوۡلٗا مِّن رَّبّٖ", last: "رَّبّٖ رَّحِيمٖ" },
  { number: 59, first: "وَٱمۡتَٰزُواْ ٱلۡيَوۡمَ أَيُّهَا ٱلۡمُجۡرِمُونَ", last: "أَيُّهَا ٱلۡمُجۡرِمُونَ" },
  { number: 60, first: "أَلَمۡ أَعۡهَدۡ إِلَيۡكُمۡ يَٰبَنِيٓ", last: "عَدُوّٞ مُّبِينٞ" },
  { number: 61, first: "وَأَنِ ٱعۡبُدُونِيۚ هَٰذَا صِرَٰطٞ", last: "صِرَٰطٞ مُّسۡتَقِيمٞ" },
  { number: 62, first: "وَلَقَدۡ أَضَلَّ مِنكُمۡ جِبِلّٗا", last: "أَفَلَمۡ تَكُونُواْ تَعۡقِلُونَ" },
  { number: 63, first: "هَٰذِهِۦ جَهَنَّمُ ٱلَّتِي كُنتُمۡ", last: "بِمَا كُنتُمۡ تَكۡفُرُونَ" },
  { number: 64, first: "ٱصۡلَوۡهَا ٱلۡيَوۡمَ بِمَا كُنتُمۡ", last: "بِمَا كُنتُمۡ تَكۡذِبُونَ" },
  { number: 65, first: "ٱلۡيَوۡمَ نَخۡتِمُ عَلَىٰٓ أَفۡوَٰهِهِمۡ", last: "بِمَا كَانُواْ يَكۡسِبُونَ" },
  { number: 66, first: "وَلَوۡ نَشَآءُ لَطَمَسۡنَا عَلَىٰٓ", last: "فَأَنَّىٰ يُبۡصِرُونَ" },
  { number: 67, first: "وَلَوۡ نَشَآءُ لَمَسَخۡنَٰهُمۡ عَلَىٰ", last: "وَلَا يَرۡجِعُونَ" },
  { number: 68, first: "وَمَن نُّعَمِّرۡهُ نُنَكِّسۡهُ فِي", last: "أَفَلَا يَعۡقِلُونَ" },
  { number: 69, first: "وَمَا عَلَّمۡنَٰهُ ٱلشِّعۡرَ وَمَا", last: "وَقُرۡءَانٞ مُّبِينٞ" },
  { number: 70, first: "لِّيُنذِرَ مَن كَانَ حَيّٗا", last: "عَلَى ٱلۡكَٰفِرِينَ" },
  { number: 71, first: "أَوَلَمۡ يَرَوۡاْ أَنَّا خَلَقۡنَا", last: "فَهُمۡ لَهَا مَٰلِكُونَ" },
  { number: 72, first: "وَذَلَّلۡنَٰهَا لَهُمۡ فَمِنۡهَا رَكُوبُهُمۡ", last: "وَمِنۡهَا يَأۡكُلُونَ" },
  { number: 73, first: "وَلَهُمۡ فِيهَا مَنَٰفِعُ وَمَشَارِبُۚ", last: "أَفَلَا يَشۡكُرُونَ" },
  { number: 74, first: "وَٱتَّخَذُواْ مِن دُونِ ٱللَّهِ", last: "لَعَلَّهُمۡ يُنصَرُونَ" },
  { number: 75, first: "لَا يَسۡتَطِيعُونَ نَصۡرَهُمۡ وَهُمۡ", last: "لَهُمۡ جُندٞ مُّحۡضَرُونَ" },
  { number: 76, first: "فَلَا يَحۡزُنكَ قَوۡلُهُمۡۘ إِنَّا", last: "وَمَا يُعۡلِنُونَ" },
  { number: 77, first: "أَوَلَمۡ يَرَ ٱلۡإِنسَٰنُ أَنَّا", last: "وَهُوَ خَصِيمٞ مُّبِينٞ" },
  { number: 78, first: "وَضَرَبَ لَنَا مَثَلٗا وَنَسِيَ", last: "وَهِيَ رَمِيمٞ" },
  { number: 79, first: "قُلۡ يُحۡيِيهَا ٱلَّذِيٓ أَنشَأَهَآ", last: "بِكُلِّ خَلۡقٍ عَلِيمٌ" },
  { number: 80, first: "ٱلَّذِي جَعَلَ لَكُم مِّنَ", last: "مِّنۡهُ تُوقِدُونَ" },
  { number: 81, first: "أَوَلَيۡسَ ٱلَّذِي خَلَقَ ٱلسَّمَٰوَٰتِ", last: "وَهُوَ ٱلۡخَلَّٰقُ ٱلۡعَلِيمُ" },
  { number: 82, first: "إِنَّمَآ أَمۡرُهُۥٓ إِذَآ أَرَادَ", last: "لَهُۥ كُن فَيَكُونُ" },
  { number: 83, first: "فَسُبۡحَٰنَ ٱلَّذِي بِيَدِهِۦ مَلَكُوتُ", last: "وَإِلَيۡهِ تُرۡجَعُونَ" }
];

const TOTAL_AYAHS = 83;

const SurahYasin = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, boolean>>({});
  const [lastCheckedAyah, setLastCheckedAyah] = useState<number | null>(null);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("yasinProgress");
    const savedLastChecked = localStorage.getItem("lastCheckedAyah");
    
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    if (savedLastChecked) {
      setLastCheckedAyah(parseInt(savedLastChecked));
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("yasinProgress", JSON.stringify(progress));
    if (lastCheckedAyah !== null) {
      localStorage.setItem("lastCheckedAyah", lastCheckedAyah.toString());
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
        localStorage.removeItem("lastCheckedAyah");
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
      localStorage.removeItem("yasinProgress");
      localStorage.removeItem("lastCheckedAyah");
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
            سورة يٰسٓ
          </h1>
          <p className="text-white/80 text-sm md:text-base">Surah Yasin - 83 Ayahs</p>
        </div>

        {/* Progress Bar Section */}
        <div className="bg-[#f8f9fa] px-4 py-3 md:px-6 md:py-4">
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
                    className="flex-1 text-lg md:text-xl leading-loose"
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

export default SurahYasin;
