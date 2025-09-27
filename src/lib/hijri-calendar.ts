// Hijri Calendar Utility Functions
export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  monthNameArabic: string;
}

const hijriMonthNames = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const hijriMonthNamesArabic = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

/**
 * Convert Gregorian date to Hijri date
 * This is an approximation algorithm for educational purposes
 * For more accurate results, consider using a dedicated Islamic calendar library
 */
export function gregorianToHijri(gregorianDate: Date): HijriDate {
  // Basic conversion algorithm (Kuwaitical algorithm approximation)
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1;
  const gDay = gregorianDate.getDate();
  
  // Calculate Julian Day Number
  let jd: number;
  if (gMonth <= 2) {
    const adjustedYear = gYear - 1;
    const adjustedMonth = gMonth + 12;
    jd = Math.floor(365.25 * adjustedYear) + Math.floor(30.6001 * (adjustedMonth + 1)) + gDay + 1720995;
  } else {
    jd = Math.floor(365.25 * gYear) + Math.floor(30.6001 * (gMonth + 1)) + gDay + 1720995;
  }
  
  // Gregorian calendar adjustment
  if (gYear >= 1583 || (gYear === 1582 && gMonth >= 10)) {
    const a = Math.floor(gYear / 100);
    const b = 2 - a + Math.floor(a / 4);
    jd += b;
  }
  
  // Convert to Hijri
  const hijriEpoch = 1948440.5; // July 16, 622 CE (Julian)
  const daysSinceHijriEpoch = jd - hijriEpoch;
  
  // Average Hijri year is about 354.367 days
  const hijriYear = Math.floor(daysSinceHijriEpoch / 354.367) + 1;
  const remainingDays = Math.floor(daysSinceHijriEpoch - ((hijriYear - 1) * 354.367));
  
  // Calculate month and day (simplified)
  let month = 1;
  let dayOfYear = remainingDays;
  
  // Approximate month lengths (alternating 30 and 29 days)
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  
  // Adjust for leap year (adds a day to the last month)
  if (isHijriLeapYear(hijriYear)) {
    monthLengths[11] = 30;
  }
  
  for (let i = 0; i < 12; i++) {
    if (dayOfYear <= monthLengths[i]) {
      month = i + 1;
      break;
    }
    dayOfYear -= monthLengths[i];
  }
  
  const day = dayOfYear;
  
  return {
    year: hijriYear,
    month: month,
    day: day,
    monthName: hijriMonthNames[month - 1],
    monthNameArabic: hijriMonthNamesArabic[month - 1]
  };
}

/**
 * Check if a Hijri year is a leap year
 * In the Islamic calendar, leap years follow a 30-year cycle
 */
function isHijriLeapYear(year: number): boolean {
  const cycle = year % 30;
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  return leapYears.includes(cycle);
}

/**
 * Format Hijri date as a string
 */
export function formatHijriDate(hijriDate: HijriDate, options: {
  includeWeekday?: boolean;
  useArabicMonths?: boolean;
  format?: 'short' | 'long';
} = {}): string {
  const { useArabicMonths = false, format = 'long' } = options;
  
  const monthName = useArabicMonths ? hijriDate.monthNameArabic : hijriDate.monthName;
  
  if (format === 'short') {
    return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
  }
  
  return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
}

/**
 * Get current Hijri date
 */
export function getCurrentHijriDate(): HijriDate {
  return gregorianToHijri(new Date());
}