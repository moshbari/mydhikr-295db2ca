import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, AlertCircle, Trash2 } from "lucide-react";
import { useIslamicOptions } from "@/hooks/use-islamic-options";
import { useCustomOptions } from "@/hooks/use-custom-options";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { useQuranProgress } from "@/hooks/use-quran-progress";
import { buildProgress, totalVersesInName, type QuranRange } from "@/lib/quran-range";
import { worshipMatchKey } from "@/lib/worship-name";

interface TrackerSectionProps {
  title: string;
  icon: string;
  type: "dhikr" | "quran" | "salah";
  onAdd: (name: string, count: number, extraInfo?: string) => void;
}

export function TrackerSection({ title, icon, type, onAdd }: TrackerSectionProps) {
  const { options: dbOptions, loading: optionsLoading } = useIslamicOptions(type);
  const builtInOptions = dbOptions.filter(opt => opt.is_active).map(opt => opt.name);
  const { customOptions, addCustomOption, removeCustomOption } = useCustomOptions(type, builtInOptions);
  const { rangesFor, refreshProgress } = useQuranProgress();
  /// Readings added in this sitting, so the bookmark moves the moment one is
  /// added rather than waiting for the server to answer.
  const [sessionRanges, setSessionRanges] = useState<{ name: string; range: QuranRange }[]>([]);
  const [managingTypes, setManagingTypes] = useState<boolean>(false);
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
    return [...customOptions, ...builtInOptions];
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

  const currentName = showCustomInput ? customName.trim() : selectedOption;

  /// How far through this surah the member has got, over every day they have
  /// ever recorded. Null for anything that isn't a surah.
  const quranProgress = (() => {
    if (type !== "quran") return null;
    const total = totalVersesInName(currentName);
    if (!currentName || total <= 0) return null;

    const key = worshipMatchKey(currentName);
    const justAdded = sessionRanges.filter((r) => worshipMatchKey(r.name) === key).map((r) => r.range);
    return buildProgress(total, [...rangesFor(currentName), ...justAdded]);
  })();

  // Clear error when selection changes
  useEffect(() => {
    setVerseError("");
  }, [selectedOption, customName]);

  // Start where the last reading of this surah stopped. It only fills an empty
  // pair of boxes, so it can never overwrite what is being typed.
  useEffect(() => {
    if (type !== "quran" || isCompleteSurah) return;
    if (startValue || endValue) return;
    if (!quranProgress?.nextVerse) return;
    setStartValue(String(quranProgress.nextVerse));
  }, [type, isCompleteSurah, startValue, endValue, quranProgress?.nextVerse]);

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

  const handleAdd = async () => {
    const name = showCustomInput ? customName.trim() : selectedOption;
    
    if (type === "quran") {
      const start = parseInt(startValue);
      const end = parseInt(endValue);
      const difference = end - start + 1; // +1 because start verse is also read
      
      // Check for verse validation errors
      if (verseError) {
        await haptics.error();
        sounds.error();
        return; // Don't add if there are validation errors
      }
      
      if (name && !isNaN(start) && !isNaN(end) && difference > 0) {
        await haptics.success();
        sounds.add();
        const rangeInfo = `${start} → ${end}`;
        onAdd(name, difference, rangeInfo);
        setSessionRanges((prev) => [...prev, { name, range: { start, end } }]);
        refreshProgress();
        // The surah stays selected: the next sitting almost always carries on
        // in the same one, and the boxes refill with the verse after this.
        setStartValue("");
        setEndValue("");
        setVerseError("");
        setIsCompleteSurah(false);
        setShowCustomInput(false);
      }
    } else {
      const count = parseInt(numberValue);
      
      if (name && count > 0) {
        await haptics.success();
        sounds.add();
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
                  {customOptions.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        My {title.toLowerCase()} types
                      </div>
                      {customOptions.map((option) => (
                        <SelectItem
                          key={`custom-${option}`}
                          value={option}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          {option}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1">
                        All {title.toLowerCase()}
                      </div>
                    </>
                  )}
                  {builtInOptions.map((option) => (
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
                onClick={async () => {
                  await haptics.light();
                  setShowCustomInput(true);
                }}
                className="w-full touch-target"
              >
                <Plus className="w-4 h-4 mr-2" />
                New {title.toLowerCase()} type
              </Button>

              {customOptions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManagingTypes(!managingTypes)}
                  className="w-full touch-target text-xs text-muted-foreground"
                >
                  {managingTypes ? "Done" : "Manage my types"}
                </Button>
              )}

              {managingTypes && (
                <div className="rounded-md border border-input p-2 space-y-1">
                  {customOptions.map((option) => (
                    <div key={`manage-${option}`} className="flex items-center gap-2">
                      <span className="flex-1 text-sm truncate">{option}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await haptics.light();
                          removeCustomOption(option);
                          if (selectedOption === option) setSelectedOption("");
                        }}
                        className="h-8 w-8 p-0 text-destructive"
                        aria-label={`Remove ${option}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    Removing a type only takes it off this list. Anything you already
                    logged stays in your history.
                  </p>
                </div>
              )}
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
              
              <p className="text-xs text-muted-foreground">
                It stays in your {title.toLowerCase()} list for every day, not just today.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await haptics.light();
                    setShowCustomInput(false);
                    setCustomName("");
                  }}
                  className="flex-1 touch-target"
                >
                  Back to List
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!customName.trim()}
                  onClick={async () => {
                    const added = addCustomOption(customName);
                    if (!added) return;
                    await haptics.success();
                    setSelectedOption(added);
                    setCustomName("");
                    setShowCustomInput(false);
                  }}
                  className="flex-1 touch-target"
                >
                  Save type
                </Button>
              </div>
            </>
          )}
          
          <Button 
            onClick={handleAdd} 
            disabled={isAddDisabled()}
            className="w-full touch-target"
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

              {quranProgress && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                  {!quranProgress.hasReadAnything ? (
                    <span>Nothing recorded from this surah yet — start at verse 1.</span>
                  ) : quranProgress.isComplete ? (
                    <span>Finished — all {quranProgress.totalVerses} verses recorded.</span>
                  ) : (
                    <span>
                      Read to verse <strong>{quranProgress.furthestVerse}</strong> of{" "}
                      {quranProgress.totalVerses}. Carry on from verse{" "}
                      <strong>{quranProgress.nextVerse}</strong>.
                    </span>
                  )}
                  {quranProgress.hasReadAnything &&
                    quranProgress.versesRead < quranProgress.furthestVerse && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {quranProgress.versesRead} verses recorded, so some earlier ones are still missing.
                      </p>
                    )}
                </div>
              )}

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