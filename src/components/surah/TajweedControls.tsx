import { Info, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TAJWEED_RULES, tajweedInk } from "@/lib/tajweed";

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
          (enabled ? "text-white" : "bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-muted")
        }
        style={enabled ? { backgroundColor: accentColor } : undefined}
      >
        <Palette className="w-4 h-4" />
        Tajweed
      </button>
      {enabled && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-muted-foreground hover:text-gray-800 dark:hover:text-foreground" aria-label="Tajweed colour guide">
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
                  <span className="mt-1 w-4 h-4 rounded-full shrink-0 tajweed-swatch" style={tajweedInk(r.color)} />
                  <div>
                    <p className="font-semibold tajweed-ink" style={tajweedInk(r.color)}>{r.name}</p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">{r.instruction}</p>
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
