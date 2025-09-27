import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { dhikrOptions, quranOptions, salahOptions } from "@/data/islamic-options";

interface TrackerSectionProps {
  title: string;
  icon: string;
  type: "dhikr" | "quran" | "salah";
  onAdd: (name: string, count: number) => void;
}

export function TrackerSection({ title, icon, type, onAdd }: TrackerSectionProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
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
    const name = showCustomInput ? customName.trim() : selectedOption;
    const count = parseInt(numberValue);
    
    if (name && count > 0) {
      onAdd(name, count);
      setSelectedOption("");
      setCustomName("");
      setNumberValue("0");
      setShowCustomInput(false);
    }
  };

  const isAddDisabled = () => {
    const name = showCustomInput ? customName.trim() : selectedOption;
    return !name || parseInt(numberValue) <= 0 || isNaN(parseInt(numberValue));
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
              <Select value={selectedOption} onValueChange={setSelectedOption}>
                <SelectTrigger className="w-full bg-background border border-input">
                  <SelectValue placeholder={`Select ${title.toLowerCase()}...`} />
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
          <NumberPad
            value={numberValue}
            onChange={setNumberValue}
            onAdd={handleAdd}
            disabled={isAddDisabled()}
          />
        </div>
      </div>
    </div>
  );
}