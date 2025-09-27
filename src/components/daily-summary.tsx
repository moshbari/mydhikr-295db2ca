import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface DailyEntry {
  id: number;
  type: "dhikr" | "quran" | "salah";
  name: string;
  count: number;
  timestamp: string;
}

interface DailySummaryProps {
  entries: DailyEntry[];
}

export function DailySummary({ entries }: DailySummaryProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "dhikr":
        return "bg-primary text-primary-foreground";
      case "quran":
        return "bg-accent text-accent-foreground";
      case "salah":
        return "bg-success text-success-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dhikr":
        return "📿";
      case "quran":
        return "📖";
      case "salah":
        return "🤲";
      default:
        return "✨";
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case "dhikr":
        return "Dhikr";
      case "quran":
        return "Quran";
      case "salah":
        return "Salah";
      default:
        return type;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="tracker-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Daily Summary</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🕌</div>
          <p className="text-muted-foreground">No entries yet today</p>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your Islamic activities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tracker-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Daily Summary</h3>
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getTypeIcon(entry.type)}</span>
                <div>
                  <p className="font-medium text-foreground">{entry.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTypeColor(entry.type)}>
                      {formatType(entry.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-primary">{entry.count}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}