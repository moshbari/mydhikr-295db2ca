import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { useSurahFontSize } from "@/hooks/use-surah-font-size";
import { FontSizeSelector } from "@/components/surah/FontSizeSelector";
import { FloatingVoiceAyahSearch } from "@/components/surah/FloatingVoiceAyahSearch";

// Ayah data for Surah Yasin
const AYAH_DATA = [
  { number: 1, text: "يسٓ" },
  { number: 2, text: "وَٱلْقُرْءَانِ ٱلْحَكِيمِ" },
  { number: 3, text: "إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ" },
  { number: 4, text: "عَلَىٰ صِرَٰطٍۢ مُّسْتَقِيمٍۢ" },
  { number: 5, text: "تَنزِيلَ ٱلْعَزِيزِ ٱلرَّحِيمِ" },
  { number: 6, text: "لِتُنذِرَ قَوْمًۭا مَّآ أُنذِرَ ءَابَآؤُهُمْ فَهُمْ غَٰفِلُونَ" },
  { number: 7, text: "لَقَدْ حَقَّ ٱلْقَوْلُ عَلَىٰٓ أَكْثَرِهِمْ فَهُمْ لَا يُؤْمِنُونَ" },
  { number: 8, text: "إِنَّا جَعَلْنَا فِىٓ أَعْنَٰقِهِمْ أَغْلَٰلًۭا فَهِىَ إِلَى ٱلْأَذْقَانِ فَهُم مُّقْمَحُونَ" },
  { number: 9, text: "وَجَعَلْنَا مِنۢ بَيْنِ أَيْدِيهِمْ سَدًّۭا وَمِنْ خَلْفِهِمْ سَدًّۭا فَأَغْشَيْنَٰهُمْ فَهُمْ لَا يُبْصِرُونَ" },
  { number: 10, text: "وَسَوَآءٌ عَلَيْهِمْ ءَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ" },
  { number: 11, text: "إِنَّمَا تُنذِرُ مَنِ ٱتَّبَعَ ٱلذِّكْرَ وَخَشِىَ ٱلرَّحْمَٰنَ بِٱلْغَيْبِ ۖ فَبَشِّرْهُ بِمَغْفِرَةٍۢ وَأَجْرٍۢ كَرِيمٍ" },
  { number: 12, text: "إِنَّا نَحْنُ نُحْىِ ٱلْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا۟ وَءَاثَٰرَهُمْ ۚ وَكُلَّ شَىْءٍ أَحْصَيْنَٰهُ فِىٓ إِمَامٍۢ مُّبِينٍۢ" },
  { number: 13, text: "وَٱضْرِبْ لَهُم مَّثَلًا أَصْحَٰبَ ٱلْقَرْيَةِ إِذْ جَآءَهَا ٱلْمُرْسَلُونَ" },
  { number: 14, text: "إِذْ أَرْسَلْنَآ إِلَيْهِمُ ٱثْنَيْنِ فَكَذَّبُوهُمَا فَعَزَّزْنَا بِثَالِثٍۢ فَقَالُوٓا۟ إِنَّآ إِلَيْكُم مُّرْسَلُونَ" },
  { number: 15, text: "قَالُوا۟ مَآ أَنتُمْ إِلَّا بَشَرٌۭ مِّثْلُنَا وَمَآ أَنزَلَ ٱلرَّحْمَٰنُ مِن شَىْءٍ إِنْ أَنتُمْ إِلَّا تَكْذِبُونَ" },
  { number: 16, text: "قَالُوا۟ رَبُّنَا يَعْلَمُ إِنَّآ إِلَيْكُمْ لَمُرْسَلُونَ" },
  { number: 17, text: "وَمَا عَلَيْنَآ إِلَّا ٱلْبَلَٰغُ ٱلْمُبِينُ" },
  { number: 18, text: "قَالُوٓا۟ إِنَّا تَطَيَّرْنَا بِكُمْ ۖ لَئِن لَّمْ تَنتَهُوا۟ لَنَرْجُمَنَّكُمْ وَلَيَمَسَّنَّكُم مِّنَّا عَذَابٌ أَلِيمٌۭ" },
  { number: 19, text: "قَالُوا۟ طَٰٓئِرُكُم مَّعَكُمْ ۚ أَئِن ذُكِّرْتُم ۚ بَلْ أَنتُمْ قَوْمٌۭ مُّسْرِفُونَ" },
  { number: 20, text: "وَجَآءَ مِنْ أَقْصَا ٱلْمَدِينَةِ رَجُلٌۭ يَسْعَىٰ قَالَ يَٰقَوْمِ ٱتَّبِعُوا۟ ٱلْمُرْسَلِينَ" },
  { number: 21, text: "ٱتَّبِعُوا۟ مَن لَّا يَسْـَٔلُكُمْ أَجْرًۭا وَهُم مُّهْتَدُونَ" },
  { number: 22, text: "وَمَا لِىَ لَآ أَعْبُدُ ٱلَّذِى فَطَرَنِى وَإِلَيْهِ تُرْجَعُونَ" },
  { number: 23, text: "ءَأَتَّخِذُ مِن دُونِهِۦٓ ءَالِهَةً إِن يُرِدْنِ ٱلرَّحْمَٰنُ بِضُرٍّۢ لَّا تُغْنِ عَنِّى شَفَٰعَتُهُمْ شَيْـًۭٔا وَلَا يُنقِذُونِ" },
  { number: 24, text: "إِنِّىٓ إِذًۭا لَّفِى ضَلَٰلٍۢ مُّبِينٍ" },
  { number: 25, text: "إِنِّىٓ ءَامَنتُ بِرَبِّكُمْ فَٱسْمَعُونِ" },
  { number: 26, text: "قِيلَ ٱدْخُلِ ٱلْجَنَّةَ ۖ قَالَ يَٰلَيْتَ قَوْمِى يَعْلَمُونَ" },
  { number: 27, text: "بِمَا غَفَرَ لِى رَبِّى وَجَعَلَنِى مِنَ ٱلْمُكْرَمِينَ" },
  { number: 28, text: "وَمَآ أَنزَلْنَا عَلَىٰ قَوْمِهِۦ مِنۢ بَعْدِهِۦ مِن جُندٍۢ مِّنَ ٱلسَّمَآءِ وَمَا كُنَّا مُنزِلِينَ" },
  { number: 29, text: "إِن كَانَتْ إِلَّا صَيْحَةًۭ وَٰحِدَةًۭ فَإِذَا هُمْ خَٰمِدُونَ" },
  { number: 30, text: "يَٰحَسْرَةً عَلَى ٱلْعِبَادِ ۚ مَا يَأْتِيهِم مِّن رَّسُولٍ إِلَّا كَانُوا۟ بِهِۦ يَسْتَهْزِءُونَ" },
  { number: 31, text: "أَلَمْ يَرَوْا۟ كَمْ أَهْلَكْنَا قَبْلَهُم مِّنَ ٱلْقُرُونِ أَنَّهُمْ إِلَيْهِمْ لَا يَرْجِعُونَ" },
  { number: 32, text: "وَإِن كُلٌّۭ لَّمَّا جَمِيعٌۭ لَّدَيْنَا مُحْضَرُونَ" },
  { number: 33, text: "وَءَايَةٌۭ لَّهُمُ ٱلْأَرْضُ ٱلْمَيْتَةُ أَحْيَيْنَٰهَا وَأَخْرَجْنَا مِنْهَا حَبًّۭا فَمِنْهُ يَأْكُلُونَ" },
  { number: 34, text: "وَجَعَلْنَا فِيهَا جَنَّٰتٍۢ مِّن نَّخِيلٍۢ وَأَعْنَٰبٍۢ وَفَجَّرْنَا فِيهَا مِنَ ٱلْعُيُونِ" },
  { number: 35, text: "لِيَأْكُلُوا۟ مِن ثَمَرِهِۦ وَمَا عَمِلَتْهُ أَيْدِيهِمْ ۖ أَفَلَا يَشْكُرُونَ" },
  { number: 36, text: "سُبْحَٰنَ ٱلَّذِى خَلَقَ ٱلْأَزْوَٰجَ كُلَّهَا مِمَّا تُنۢبِتُ ٱلْأَرْضُ وَمِنْ أَنفُسِهِمْ وَمِمَّا لَا يَعْلَمُونَ" },
  { number: 37, text: "وَءَايَةٌۭ لَّهُمُ ٱلَّيْلُ نَسْلَخُ مِنْهُ ٱلنَّهَارَ فَإِذَا هُم مُّظْلِمُونَ" },
  { number: 38, text: "وَٱلشَّمْسُ تَجْرِى لِمُسْتَقَرٍّۢ لَّهَا ۚ ذَٰلِكَ تَقْدِيرُ ٱلْعَزِيزِ ٱلْعَلِيمِ" },
  { number: 39, text: "وَٱلْقَمَرَ قَدَّرْنَٰهُ مَنَازِلَ حَتَّىٰ عَادَ كَٱلْعُرْجُونِ ٱلْقَدِيمِ" },
  { number: 40, text: "لَا ٱلشَّمْسُ يَنۢبَغِى لَهَآ أَن تُدْرِكَ ٱلْقَمَرَ وَلَا ٱلَّيْلُ سَابِقُ ٱلنَّهَارِ ۚ وَكُلٌّۭ فِى فَلَكٍۢ يَسْبَحُونَ" },
  { number: 41, text: "وَءَايَةٌۭ لَّهُمْ أَنَّا حَمَلْنَا ذُرِّيَّتَهُمْ فِى ٱلْفُلْكِ ٱلْمَشْحُونِ" },
  { number: 42, text: "وَخَلَقْنَا لَهُم مِّن مِّثْلِهِۦ مَا يَرْكَبُونَ" },
  { number: 43, text: "وَإِن نَّشَأْ نُغْرِقْهُمْ فَلَا صَرِيخَ لَهُمْ وَلَا هُمْ يُنقَذُونَ" },
  { number: 44, text: "إِلَّا رَحْمَةًۭ مِّنَّا وَمَتَٰعًا إِلَىٰ حِينٍۢ" },
  { number: 45, text: "وَإِذَا قِيلَ لَهُمُ ٱتَّقُوا۟ مَا بَيْنَ أَيْدِيكُمْ وَمَا خَلْفَكُمْ لَعَلَّكُمْ تُرْحَمُونَ" },
  { number: 46, text: "وَمَا تَأْتِيهِم مِّنْ ءَايَةٍۢ مِّنْ ءَايَٰتِ رَبِّهِمْ إِلَّا كَانُوا۟ عَنْهَا مُعْرِضِينَ" },
  { number: 47, text: "وَإِذَا قِيلَ لَهُمْ أَنفِقُوا۟ مِمَّا رَزَقَكُمُ ٱللَّهُ قَالَ ٱلَّذِينَ كَفَرُوا۟ لِلَّذِينَ ءَامَنُوٓا۟ أَنُطْعِمُ مَن لَّوْ يَشَآءُ ٱللَّهُ أَطْعَمَهُۥٓ إِنْ أَنتُمْ إِلَّا فِى ضَلَٰلٍۢ مُّبِينٍۢ" },
  { number: 48, text: "وَيَقُولُونَ مَتَىٰ هَٰذَا ٱلْوَعْدُ إِن كُنتُمْ صَٰدِقِينَ" },
  { number: 49, text: "مَا يَنظُرُونَ إِلَّا صَيْحَةًۭ وَٰحِدَةًۭ تَأْخُذُهُمْ وَهُمْ يَخِصِّمُونَ" },
  { number: 50, text: "فَلَا يَسْتَطِيعُونَ تَوْصِيَةًۭ وَلَآ إِلَىٰٓ أَهْلِهِمْ يَرْجِعُونَ" },
  { number: 51, text: "وَنُفِخَ فِى ٱلصُّورِ فَإِذَا هُم مِّنَ ٱلْأَجْدَاثِ إِلَىٰ رَبِّهِمْ يَنسِلُونَ" },
  { number: 52, text: "قَالُوا۟ يَٰوَيْلَنَا مَنۢ بَعَثَنَا مِن مَّرْقَدِنَا ۜ ۗ هَٰذَا مَا وَعَدَ ٱلرَّحْمَٰنُ وَصَدَقَ ٱلْمُرْسَلُونَ" },
  { number: 53, text: "إِن كَانَتْ إِلَّا صَيْحَةًۭ وَٰحِدَةًۭ فَإِذَا هُمْ جَمِيعٌۭ لَّدَيْنَا مُحْضَرُونَ" },
  { number: 54, text: "فَٱلْيَوْمَ لَا تُظْلَمُ نَفْسٌۭ شَيْـًۭٔا وَلَا تُجْزَوْنَ إِلَّا مَا كُنتُمْ تَعْمَلُونَ" },
  { number: 55, text: "إِنَّ أَصْحَٰبَ ٱلْجَنَّةِ ٱلْيَوْمَ فِى شُغُلٍۢ فَٰكِهُونَ" },
  { number: 56, text: "هُمْ وَأَزْوَٰجُهُمْ فِى ظِلَٰلٍ عَلَى ٱلْأَرَآئِكِ مُتَّكِـُٔونَ" },
  { number: 57, text: "لَهُمْ فِيهَا فَٰكِهَةٌۭ وَلَهُم مَّا يَدَّعُونَ" },
  { number: 58, text: "سَلَٰمٌۭ قَوْلًۭا مِّن رَّبٍّۢ رَّحِيمٍۢ" },
  { number: 59, text: "وَٱمْتَٰزُوا۟ ٱلْيَوْمَ أَيُّهَا ٱلْمُجْرِمُونَ" },
  { number: 60, text: "أَلَمْ أَعْهَدْ إِلَيْكُمْ يَٰبَنِىٓ ءَادَمَ أَن لَّا تَعْبُدُوا۟ ٱلشَّيْطَٰنَ ۖ إِنَّهُۥ لَكُمْ عَدُوٌّۭ مُّبِينٌۭ" },
  { number: 61, text: "وَأَنِ ٱعْبُدُونِى ۚ هَٰذَا صِرَٰطٌۭ مُّسْتَقِيمٌۭ" },
  { number: 62, text: "وَلَقَدْ أَضَلَّ مِنكُمْ جِبِلًّۭا كَثِيرًا ۖ أَفَلَمْ تَكُونُوا۟ تَعْقِلُونَ" },
  { number: 63, text: "هَٰذِهِۦ جَهَنَّمُ ٱلَّتِى كُنتُمْ تُوعَدُونَ" },
  { number: 64, text: "ٱصْلَوْهَا ٱلْيَوْمَ بِمَا كُنتُمْ تَكْفُرُونَ" },
  { number: 65, text: "ٱلْيَوْمَ نَخْتِمُ عَلَىٰٓ أَفْوَٰهِهِمْ وَتُكَلِّمُنَآ أَيْدِيهِمْ وَتَشْهَدُ أَرْجُلُهُم بِمَا كَانُوا۟ يَكْسِبُونَ" },
  { number: 66, text: "وَلَوْ نَشَآءُ لَطَمَسْنَا عَلَىٰٓ أَعْيُنِهِمْ فَٱسْتَبَقُوا۟ ٱلصِّرَٰطَ فَأَنَّىٰ يُبْصِرُونَ" },
  { number: 67, text: "وَلَوْ نَشَآءُ لَمَسَخْنَٰهُمْ عَلَىٰ مَكَانَتِهِمْ فَمَا ٱسْتَطَٰعُوا۟ مُضِيًّۭا وَلَا يَرْجِعُونَ" },
  { number: 68, text: "وَمَن نُّعَمِّرْهُ نُنَكِّسْهُ فِى ٱلْخَلْقِ ۖ أَفَلَا يَعْقِلُونَ" },
  { number: 69, text: "وَمَا عَلَّمْنَٰهُ ٱلشِّعْرَ وَمَا يَنۢبَغِى لَهُۥٓ ۚ إِنْ هُوَ إِلَّا ذِكْرٌۭ وَقُرْءَانٌۭ مُّبِينٌۭ" },
  { number: 70, text: "لِّيُنذِرَ مَن كَانَ حَيًّۭا وَيَحِقَّ ٱلْقَوْلُ عَلَى ٱلْكَٰفِرِينَ" },
  { number: 71, text: "أَوَلَمْ يَرَوْا۟ أَنَّا خَلَقْنَا لَهُم مِّمَّا عَمِلَتْ أَيْدِينَآ أَنْعَٰمًۭا فَهُمْ لَهَا مَٰلِكُونَ" },
  { number: 72, text: "وَذَلَّلْنَٰهَا لَهُمْ فَمِنْهَا رَكُوبُهُمْ وَمِنْهَا يَأْكُلُونَ" },
  { number: 73, text: "وَلَهُمْ فِيهَا مَنَٰفِعُ وَمَشَارِبُ ۖ أَفَلَا يَشْكُرُونَ" },
  { number: 74, text: "وَٱتَّخَذُوا۟ مِن دُونِ ٱللَّهِ ءَالِهَةًۭ لَّعَلَّهُمْ يُنصَرُونَ" },
  { number: 75, text: "لَا يَسْتَطِيعُونَ نَصْرَهُمْ وَهُمْ لَهُمْ جُندٌۭ مُّحْضَرُونَ" },
  { number: 76, text: "فَلَا يَحْزُنكَ قَوْلُهُمْ ۘ إِنَّا نَعْلَمُ مَا يُسِرُّونَ وَمَا يُعْلِنُونَ" },
  { number: 77, text: "أَوَلَمْ يَرَ ٱلْإِنسَٰنُ أَنَّا خَلَقْنَٰهُ مِن نُّطْفَةٍۢ فَإِذَا هُوَ خَصِيمٌۭ مُّبِينٌۭ" },
  { number: 78, text: "وَضَرَبَ لَنَا مَثَلًۭا وَنَسِىَ خَلْقَهُۥ ۖ قَالَ مَن يُحْىِ ٱلْعِظَٰمَ وَهِىَ رَمِيمٌۭ" },
  { number: 79, text: "قُلْ يُحْيِيهَا ٱلَّذِىٓ أَنشَأَهَآ أَوَّلَ مَرَّةٍۢ ۖ وَهُوَ بِكُلِّ خَلْقٍ عَلِيمٌ" },
  { number: 80, text: "ٱلَّذِى جَعَلَ لَكُم مِّنَ ٱلشَّجَرِ ٱلْأَخْضَرِ نَارًۭا فَإِذَآ أَنتُم مِّنْهُ تُوقِدُونَ" },
  { number: 81, text: "أَوَلَيْسَ ٱلَّذِى خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ بِقَٰدِرٍ عَلَىٰٓ أَن يَخْلُقَ مِثْلَهُم ۚ بَلَىٰ وَهُوَ ٱلْخَلَّٰقُ ٱلْعَلِيمُ" },
  { number: 82, text: "إِنَّمَآ أَمْرُهُۥٓ إِذَآ أَرَادَ شَيْـًٔا أَن يَقُولَ لَهُۥ كُن فَيَكُونُ" },
  { number: 83, text: "فَسُبْحَٰنَ ٱلَّذِى بِيَدِهِۦ مَلَكُوتُ كُلِّ شَىْءٍۢ وَإِلَيْهِ تُرْجَعُونَ" },
];

const TOTAL_AYAHS = 83;

const SurahYasin = () => {
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
    // Automatically mark as read/last read
    if (!progress[ayahNumber]) {
      handleCheckAyah(ayahNumber, true);
    }
  };

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("yasinProgress");
    const savedLastChecked = localStorage.getItem("lastCheckedAyah");
    const savedLastTime = localStorage.getItem("yasinLastSaveTime");
    
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
    localStorage.setItem("yasinProgress", JSON.stringify(progress));
    if (lastCheckedAyah !== null) {
      localStorage.setItem("lastCheckedAyah", lastCheckedAyah.toString());
      const now = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      setLastSaveTime(now);
      localStorage.setItem("yasinLastSaveTime", now);
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
      setLastSaveTime(null);
      localStorage.removeItem("yasinProgress");
      localStorage.removeItem("lastCheckedAyah");
      localStorage.removeItem("yasinLastSaveTime");
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
                سورة يٰسٓ
              </h1>
              <p className="text-white/80 text-xs md:text-sm">Surah Yasin - 83 Ayahs</p>
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

export default SurahYasin;
