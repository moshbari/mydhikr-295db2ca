import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Moon, Smartphone, Sun, SunMoon } from "lucide-react";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { formatClock, sunTimes, timeZoneId, zoneCoordinates, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CHOICES: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "auto", label: "Auto (sunset to sunrise)", icon: SunMoon },
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "Match phone", icon: Smartphone },
];

/** Appearance picker in the header: Auto by default, dark from sunset to sunrise. */
export const AppearanceDialog = () => {
  const { mode, setMode } = useThemeMode();
  const [open, setOpen] = useState(false);

  const zone = timeZoneId();
  const [lat, lon] = zoneCoordinates(zone);
  const today = sunTimes(new Date(), lat, lon);
  const autoHint = today.polar
    ? `The sun ${today.polar === "night" ? "doesn't rise" : "doesn't set"} today where you are, so it stays ${today.polar === "night" ? "dark" : "light"}.`
    : `Dark after sunset (${zone || "your time zone"}: ${formatClock(today.sunset)}) and light again at sunrise (${formatClock(today.sunrise)}), so the screen won't wake anyone at Tahajjud.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="header" size="mobile" className="flex items-center gap-1">
          <SunMoon className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>Saved on this device.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2" role="radiogroup" aria-label="Appearance">
          {CHOICES.map(({ mode: m, label, icon: Icon }) => {
            const selected = m === mode;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(m)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors touch-target",
                  selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">
                  <span className="block font-medium">{label}</span>
                  {m === "auto" && <span className="block text-sm text-muted-foreground mt-1">{autoHint}</span>}
                </span>
                {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
