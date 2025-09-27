import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NumberPad } from "@/components/ui/number-pad";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TrackerSectionProps {
  title: string;
  icon: string;
  onAdd: (name: string, count: number) => void;
}

export function TrackerSection({ title, icon, onAdd }: TrackerSectionProps) {
  const [activityName, setActivityName] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("0");

  const handleAdd = () => {
    const name = activityName.trim();
    const count = parseInt(numberValue);
    
    if (name && count > 0) {
      onAdd(name, count);
      setActivityName("");
      setNumberValue("0");
    }
  };

  const isAddDisabled = () => {
    return !activityName.trim() || parseInt(numberValue) <= 0 || isNaN(parseInt(numberValue));
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Column */}
        <div className="space-y-3">
          <Input
            placeholder={`Enter ${title.toLowerCase()} name...`}
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAddDisabled()) {
                handleAdd();
              }
            }}
          />
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