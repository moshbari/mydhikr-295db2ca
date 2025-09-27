import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { dhikrOptions, quranOptions, salahOptions } from "@/data/islamic-options";

interface TrackerSectionProps {
  title: string;
  icon: string;
  type: "dhikr" | "quran" | "salah";
  onAdd: (name: string, count: number) => void;
}

export function TrackerSection({ title, icon, type, onAdd }: TrackerSectionProps) {
  const [activityName, setActivityName] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("0");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const getOptions = () => {
    switch (type) {
      case "dhikr":
        return dhikrOptions;
      case "quran":
        return quranOptions;
      case "salah":
        return salahOptions;
      default:
        return [];
    }
  };

  const handleAdd = () => {
    const name = activityName.trim();
    const count = parseInt(numberValue);
    
    if (name && count > 0) {
      onAdd(name, count);
      setActivityName("");
      setNumberValue("0");
      setShowCustomInput(false);
    }
  };

  const handleQuickAdd = (optionName: string) => {
    const count = parseInt(numberValue);
    if (count > 0) {
      onAdd(optionName, count);
      setNumberValue("0");
    }
  };

  const isAddDisabled = () => {
    return !activityName.trim() || parseInt(numberValue) <= 0 || isNaN(parseInt(numberValue));
  };

  const isQuickAddDisabled = () => {
    return parseInt(numberValue) <= 0 || isNaN(parseInt(numberValue));
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Options and Input Column */}
        <div className="space-y-3">
          {/* Default Options */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Quick Select:</h4>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {getOptions().slice(0, 12).map((option) => (
                <Badge
                  key={option}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                  onClick={() => handleQuickAdd(option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Custom Input Toggle */}
          <div className="pt-2 border-t border-border/50">
            {!showCustomInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Custom {title}
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  id={`${title.toLowerCase()}-name`}
                  name={`${title.toLowerCase()}Name`}
                  placeholder={`Enter custom ${title.toLowerCase()} name...`}
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full text-sm"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAddDisabled()) {
                      handleAdd();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAdd} 
                    disabled={isAddDisabled()}
                    className="flex-1"
                    size="sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false);
                      setActivityName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Number Pad Column */}
        <div>
          <NumberPad
            value={numberValue}
            onChange={setNumberValue}
            onAdd={() => {
              if (showCustomInput && activityName.trim()) {
                handleAdd();
              }
            }}
            disabled={showCustomInput ? isAddDisabled() : isQuickAddDisabled()}
          />
        </div>
      </div>
    </div>
  );
}