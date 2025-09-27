import { useState } from "react";
import { TrackerSection } from "@/components/tracker-section";
import { DailySummary, DailyEntry } from "@/components/daily-summary";
import { NotesSection } from "@/components/notes-section";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { dhikrOptions, quranOptions, salahOptions } from "@/data/islamic-options";

interface DailyData {
  entries: DailyEntry[];
  notes: string;
  date: string;
}

const Index = () => {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const [dailyData, setDailyData] = useLocalStorage<DailyData>(`islamic-tracker-${today}`, {
    entries: [],
    notes: "",
    date: today,
  });

  const addEntry = (type: "dhikr" | "quran" | "salah", name: string, count: number) => {
    const newEntry: DailyEntry = {
      id: Date.now(),
      type,
      name,
      count,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
    };

    setDailyData(prev => ({
      ...prev,
      entries: [newEntry, ...prev.entries],
    }));

    toast({
      title: "Entry added",
      description: `${name}: ${count} recorded`,
    });
  };

  const handleNotesChange = (notes: string) => {
    setDailyData(prev => ({
      ...prev,
      notes,
    }));
  };

  const handleSaveAll = () => {
    // Data is already saved via localStorage, this is just user feedback
    toast({
      title: "All data saved",
      description: "Your daily tracking data has been saved successfully.",
    });
  };

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to reset all data for today? This action cannot be undone.")) {
      setDailyData({
        entries: [],
        notes: "",
        date: today,
      });
      toast({
        title: "Data reset",
        description: "All today's data has been cleared.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient text-white py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">🕌 Islamic Daily Tracker</h1>
          <p className="text-white/90 text-sm sm:text-base">{todayFormatted}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Dhikr & Tasbih Section */}
        <TrackerSection
          title="Dhikr & Tasbih"
          icon="📿"
          options={dhikrOptions}
          onAdd={(name, count) => addEntry("dhikr", name, count)}
        />

        {/* Quran Recitation Section */}
        <TrackerSection
          title="Quran Recitation"
          icon="📖"
          options={quranOptions}
          onAdd={(name, count) => addEntry("quran", name, count)}
        />

        {/* Nafl Salah Section */}
        <TrackerSection
          title="Nafl Salah"
          icon="🤲"
          options={salahOptions}
          onAdd={(name, count) => addEntry("salah", name, count)}
        />

        {/* Daily Summary */}
        <DailySummary entries={dailyData.entries} />

        {/* Notes Section */}
        <NotesSection 
          notes={dailyData.notes} 
          onNotesChange={handleNotesChange} 
        />

        {/* Save/Reset Controls */}
        <div className="tracker-card">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleSaveAll} className="success-button">
              💾 Save All Data
            </Button>
            <Button onClick={handleResetAll} variant="destructive">
              🔄 Reset All Data
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground">
        <p className="text-sm">May Allah accept your worship and grant you success</p>
      </footer>
    </div>
  );
};

export default Index;
