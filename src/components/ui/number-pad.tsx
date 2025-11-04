import { Button } from "@/components/ui/button";

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export function NumberPad({ value, onChange, onAdd }: NumberPadProps) {
  const handleNumberClick = (num: string) => {
    if (value === "") {
      // If empty, set to the clicked number
      onChange(num);
    } else {
      // Otherwise append the number
      onChange(value + num);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="bg-muted/50 rounded-lg p-3 text-center min-h-[60px] flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{value || "\u00A0"}</span>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2">
        {numbers.flat().map((num) => (
          <Button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="number-pad-button"
            variant="outline"
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={handleClear}
          className="number-pad-button col-span-1 text-destructive"
          variant="outline"
        >
          Clear
        </Button>
        <Button
          onClick={() => handleNumberClick("0")}
          className="number-pad-button"
          variant="outline"
        >
          0
        </Button>
        <Button
          onClick={onAdd}
          className="islamic-button col-span-1 text-sm"
          disabled={value === "" || parseInt(value) <= 0 || isNaN(parseInt(value))}
        >
          Add
        </Button>
      </div>
    </div>
  );
}