import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT_SIZES } from "@/hooks/use-surah-font-size";
import { ReactNode } from "react";

interface FontSizeSelectorProps {
  fontSize: number;
  onFontSizeChange: (index: number) => void;
  accentColor?: string;
  rightElement?: ReactNode;
}

export function FontSizeSelector({ 
  fontSize, 
  onFontSizeChange, 
  accentColor = "#1e3c72",
  rightElement
}: FontSizeSelectorProps) {
  return (
    <div className="bg-[#f8f9fa] dark:bg-muted px-4 py-3 md:px-6 md:py-4 flex items-center justify-center gap-2">
      <Type className="w-4 h-4 text-gray-500 dark:text-muted-foreground" />
      <span className="text-sm text-gray-600 dark:text-muted-foreground mr-2">Font:</span>
      <div className="flex gap-1">
        {FONT_SIZES.map((size, index) => (
          <button
            key={size.label}
            onClick={() => onFontSizeChange(index)}
            className={cn(
              "w-8 h-8 rounded-md text-sm font-medium transition-all",
              fontSize === index
                ? "text-white"
                : "bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-muted"
            )}
            style={fontSize === index ? { backgroundColor: accentColor } : undefined}
          >
            {size.label}
          </button>
        ))}
      </div>
      {rightElement && <div className="ml-2">{rightElement}</div>}
    </div>
  );
}
