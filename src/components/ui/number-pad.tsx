import { Button } from "@/components/ui/button";

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}

export function NumberPad({ value, onChange, onAdd, disabled }: NumberPadProps) {
  const handleNumberClick = (num: string) => {
    if (value === "1") {
      // If current value is 1, replace it with the clicked number (unless it's 0)
      onChange(num === "0" ? "10" : num);
    } else if (value === "0") {
      // If current value is 0, replace it with the clicked number (unless it's 0)
      onChange(num === "0" ? "10" : num);
    } else {
      // Otherwise append the number
      onChange(value + num);
    }
  };

  const handleClear = () => {
    onChange("1");
  };

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2">
        {numbers.flat().map((num) => (
          <Button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="number-pad-button"
            disabled={disabled}
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
          disabled={disabled}
          variant="outline"
        >
          Clear
        </Button>
        <Button
          onClick={() => handleNumberClick("0")}
          className="number-pad-button"
          disabled={disabled}
          variant="outline"
        >
          0
        </Button>
        <Button
          onClick={onAdd}
          className="islamic-button col-span-1 text-sm"
          disabled={disabled || value === "" || parseInt(value) <= 0 || isNaN(parseInt(value))}
        >
          Add
        </Button>
      </div>
    </div>
  );
}