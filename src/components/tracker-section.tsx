import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, AlertCircle } from "lucide-react";
import { useIslamicOptions } from "@/hooks/use-islamic-options";

interface TrackerSectionProps {
  title: string;
  icon: string;
  type: "dhikr" | "quran" | "salah";
  onAdd: (name: string, count: number, extraInfo?: string) => void;
}

export function TrackerSection({ title, icon, type, onAdd }: TrackerSectionProps) {
  const { options: dbOptions, loading: optionsLoading } = useIslamicOptions(type);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  
  // Special state for Quran start/end tracking
  const [startValue, setStartValue] = useState<string>("");
  const [endValue, setEndValue] = useState<string>("");
  const [verseError, setVerseError] = useState<string>("");
  const [isCompleteSurah, setIsCompleteSurah] = useState<boolean>(false);

  const getOptions = () => {
    return dbOptions.map(opt => opt.name);
  };

  const extractVerseCount = (surahOption: string): number => {
    const match = surahOption.match(/\((\d+) verses?\)/);
    return match ? parseInt(match[1]) : 0;
  };

  const validateVerseRange = (start: number, end: number, selectedSurah: string): string => {
    if (selectedSurah) {
      const maxVerses = extractVerseCount(selectedSurah);
      if (maxVerses > 0) {
        if (start > maxVerses) {
          return `Start verse ${start} exceeds available verses (${maxVerses}) for this surah.`;
        }
        if (end > maxVerses) {
          return `End verse ${end} exceeds available verses (${maxVerses}) for this surah.`;
        }
      }
    }
    return "";
  };

  // Clear error when selection changes
  useEffect(() => {
    setVerseError("");
  }, [selectedOption, customName]);

  // Handle complete surah checkbox
  useEffect(() => {
    if (type === "quran" && isCompleteSurah) {
      const selectedSurah = showCustomInput ? customName.trim() : selectedOption;
      if (selectedSurah) {
        const maxVerses = extractVerseCount(selectedSurah);
        if (maxVerses > 0) {
          setStartValue("1");
          setEndValue(maxVerses.toString());
        }
      }
    }
  }, [isCompleteSurah, selectedOption, customName, type, showCustomInput]);

  // Validate verses when start/end values change
  useEffect(() => {
    if (type === "quran" && startValue && endValue) {
      const start = parseInt(startValue);
      const end = parseInt(endValue);
      const selectedSurah = showCustomInput ? customName.trim() : selectedOption;
      
      if (!isNaN(start) && !isNaN(end) && selectedSurah) {
        const error = validateVerseRange(start, end, selectedSurah);
        setVerseError(error);
      } else {
        setVerseError("");
      }
    }
  }, [startValue, endValue, selectedOption, customName, type, showCustomInput]);

  const handleAdd = () => {
    const name = showCustomInput ? customName.trim() : selectedOption;
    
    if (type === "quran") {
      const start = parseInt(startValue);
      const end = parseInt(endValue);
      const difference = end - start + 1; // +1 because start verse is also read
      
      // Check for verse validation errors
      if (verseError) {
        return; // Don't add if there are validation errors
      }
      
      if (name && !isNaN(start) && !isNaN(end) && difference > 0) {
        const rangeInfo = `${start} → ${end}`;
        onAdd(name, difference, rangeInfo);
        setSelectedOption("");
        setCustomName("");
        setStartValue("");
        setEndValue("");
        setVerseError("");
        setIsCompleteSurah(false);
        setShowCustomInput(false);
      }
    } else {
      const count = parseInt(numberValue);
      
      if (name && count > 0) {
        onAdd(name, count);
        setSelectedOption("");
        setCustomName("");
        setNumberValue("");
        setIsCompleteSurah(false);
        setShowCustomInput(false);
      }
    }
  };

  const isAddDisabled = () => {
    const name = showCustomInput ? customName.trim() : selectedOption;
    
    if (type === "quran") {
      const start = parseInt(startValue);
      const end = parseInt(endValue);
      const difference = end - start + 1; // +1 because start verse is also read
      return !name || isNaN(start) || isNaN(end) || difference <= 0 || !!verseError;
    } else {
      const count = parseInt(numberValue);
      return !name || count <= 0 || isNaN(count);
    }
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selection Column */}
        <div className="space-y-3">
          {!showCustomInput ? (
            <>
              <Select value={selectedOption} onValueChange={setSelectedOption} disabled={optionsLoading}>
                <SelectTrigger className="w-full bg-background border border-input">
                  <SelectValue placeholder={optionsLoading ? "Loading..." : `Select ${title.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-input shadow-lg z-50 max-h-60">
                  {getOptions().map((option) => (
                    <SelectItem 
                      key={option} 
                      value={option}
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomInput(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom {title}
              </Button>
            </>
          ) : (
            <>
              <Input
                id={`${title.toLowerCase()}-custom`}
                name={`${title.toLowerCase()}Custom`}
                placeholder={`Enter custom ${title.toLowerCase()} name...`}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddDisabled()) {
                    handleAdd();
                  }
                }}
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomName("");
                  }}
                  className="flex-1"
                >
                  Back to List
                </Button>
              </div>
            </>
          )}
          
          <Button 
            onClick={handleAdd} 
            disabled={isAddDisabled()}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {title}
          </Button>
        </div>

        {/* Number Pad Column */}
        <div>
          {type === "quran" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Verse Range</h3>
              
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="complete-surah"
                  checked={isCompleteSurah}
                  onCheckedChange={(checked) => setIsCompleteSurah(checked as boolean)}
                />
                <label 
                  htmlFor="complete-surah" 
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Complete Surah
                </label>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="start-input" className="text-xs text-muted-foreground mb-1 block">
                    Start (Verse)
                  </label>
                  <Input
                    id="start-input"
                    type="number"
                    placeholder="Start"
                    value={startValue}
                    onChange={(e) => setStartValue(e.target.value)}
                    className="text-center text-lg font-medium"
                    min="1"
                    disabled={isCompleteSurah}
                  />
                </div>
                
                <div>
                  <label htmlFor="end-input" className="text-xs text-muted-foreground mb-1 block">
                    End (Verse)
                  </label>
                  <Input
                    id="end-input"
                    type="number"
                    placeholder="End"
                    value={endValue}
                    onChange={(e) => setEndValue(e.target.value)}
                    className="text-center text-lg font-medium"
                    min="1"
                    disabled={isCompleteSurah}
                  />
                </div>
                
                {verseError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Invalid Range</span>
                    </div>
                    <p className="text-sm text-destructive/80 mt-1">{verseError}</p>
                  </div>
                )}
                
                {startValue && endValue && !isNaN(parseInt(startValue)) && !isNaN(parseInt(endValue)) && !verseError && (
                  <div className="p-3 bg-accent/50 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">
                      {selectedOption || customName.trim() || "Verses Read"}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {parseInt(endValue) - parseInt(startValue) + 1} 
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ({startValue} → {endValue})
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <NumberPad
              value={numberValue}
              onChange={setNumberValue}
              onAdd={handleAdd}
            />
          )}
        </div>
      </div>
    </div>
  );
}