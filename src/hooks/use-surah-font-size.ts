import { useState, useEffect } from "react";
import { haptics } from "@/lib/haptics";

export const FONT_SIZES = [
  { label: "S", value: "text-base", size: 16 },
  { label: "M", value: "text-lg", size: 18 },
  { label: "L", value: "text-xl", size: 20 },
  { label: "XL", value: "text-2xl", size: 24 },
];

const STORAGE_KEY = "surahFontSize";

export function useSurahFontSize() {
  const [fontSize, setFontSize] = useState(1); // Default to Medium (index 1)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFontSize(parseInt(saved));
    }
  }, []);

  const handleFontSizeChange = (index: number) => {
    setFontSize(index);
    localStorage.setItem(STORAGE_KEY, index.toString());
    haptics.light();
  };

  return {
    fontSize,
    fontSizeClass: FONT_SIZES[fontSize].value,
    handleFontSizeChange,
  };
}
