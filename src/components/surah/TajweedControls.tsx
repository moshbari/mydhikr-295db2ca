import { Info, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TAJWEED_RULES } from "@/lib/tajweed";

interface TajweedControlsProps {
  enabled: boolean;
  onToggle: () => void;
  accentColor?: string;
}

/** The Tajweed on/off switch, and the colour guide beside it. */
export function TajweedControls({ enabled, onToggle, accentColor = "#1e3c72" }: TajweedControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        className={
          "h-8 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all " +
          (enabled ? "text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100")
        }
        style={enabled ? { backgroundColor: accentColor } : undefined}
      >
        <Palette className="w-4 h-4" />
        Tajweed
      </button>
      {enabled && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800" aria-label="Tajweed colour guide">
              <Info className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Tajweed colours</DialogTitle>
              <DialogDescription>
                Colours follow the printed colour-coded tajweed mushaf. Reds stretch, green is nasal, blue bounces, grey is
                not pronounced.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-3">
              {TAJWEED_RULES.map((r) => (
                <li key={r.rule} className="flex gap-3">
                  <span className="mt-1 w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <div>
                    <p className="font-semibold" style={{ color: r.color }}>{r.name}</p>
                    <p className="text-sm text-gray-500">{r.instruction}</p>
                  </div>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
