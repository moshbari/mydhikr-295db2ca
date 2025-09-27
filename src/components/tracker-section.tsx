import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";

interface TrackerSectionProps {
  title: string;
  icon: string;
  options: string[];
  onAdd: (name: string, count: number) => void;
}

export function TrackerSection({ title, icon, options, onAdd }: TrackerSectionProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("0");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectionChange = (value: string) => {
    setSelectedOption(value);
    if (value === "custom") {
      setShowCustomInput(true);
      setCustomValue("");
    } else {
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const handleAdd = () => {
    const name = showCustomInput ? customValue.trim() : selectedOption;
    const count = parseInt(numberValue);
    
    if (name && count > 0) {
      onAdd(name, count);
      setNumberValue("0");
      if (showCustomInput) {
        setCustomValue("");
      }
    }
  };

  const isAddDisabled = () => {
    if (!selectedOption) return true;
    if (showCustomInput && !customValue.trim()) return true;
    return parseInt(numberValue) <= 0;
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
          <Select value={selectedOption} onValueChange={handleSelectionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${title.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="custom">Add Custom...</SelectItem>
            </SelectContent>
          </Select>

          {showCustomInput && (
            <Input
              placeholder="Enter custom name..."
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full"
            />
          )}
        </div>

        {/* Number Input Column */}
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