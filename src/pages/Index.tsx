import { useState, useEffect } from "react";
import { TrackerSection } from "@/components/tracker-section";
import { DailySummary, DailyEntry } from "@/components/daily-summary";
import { NotesSection } from "@/components/notes-section";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { dhikrOptions, quranOptions, salahOptions } from "@/data/islamic-options";
import { BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { createAdminAccounts } from "@/lib/admin-setup";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Create admin accounts on component mount
  useEffect(() => {
    createAdminAccounts();
  }, []);

  // Load today's data from database
  useEffect(() => {
    if (!user) return;
    
    const loadTodayData = async () => {
      try {
        // Load entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .order('created_at', { ascending: false });

        if (entriesError) throw entriesError;

        // Transform database entries to match component format
        const transformedEntries: DailyEntry[] = (entriesData || []).map(entry => ({
          id: entry.id,
          type: entry.type as "dhikr" | "quran" | "salah",
          name: entry.name,
          count: entry.count,
          timestamp: entry.timestamp || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
        }));

        setEntries(transformedEntries);

        // Load notes
        const { data: notesData, error: notesError } = await supabase
          .from('daily_notes')
          .select('notes')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .maybeSingle();

        if (notesError && notesError.code !== 'PGRST116') throw notesError;
        setNotes(notesData?.notes || "");

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error loading data",
          description: "There was an issue loading your tracking data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTodayData();
  }, [user, today, toast]);

  const addEntry = async (type: "dhikr" | "quran" | "salah", name: string, count: number) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .insert({
          user_id: user.id,
          type,
          name,
          count,
          entry_date: today,
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: DailyEntry = {
        id: data.id,
        type,
        name,
        count,
        timestamp: data.timestamp,
      };

      setEntries(prev => [newEntry, ...prev]);

      toast({
        title: "Entry added",
        description: `${name}: ${count} recorded`,
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error adding entry",
        description: "There was an issue saving your entry.",
        variant: "destructive",
      });
    }
  };

  const handleEditEntry = async (id: string | number, newCount: number, newName: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('daily_entries')
        .update({
          count: newCount,
          name: newName,
        })
        .eq('id', String(id))
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === id 
            ? { ...entry, count: newCount, name: newName }
            : entry
        )
      );

      toast({
        title: "Entry updated",
        description: `Updated to ${newName}: ${newCount}`,
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error updating entry",
        description: "There was an issue updating your entry.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string | number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('id', String(id))
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== id));

      toast({
        title: "Entry deleted",
        description: "The entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error deleting entry",
        description: "There was an issue deleting your entry.",
        variant: "destructive",
      });
    }
  };

  const handleNotesChange = async (newNotes: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('daily_notes')
        .upsert({
          user_id: user.id,
          entry_date: today,
          notes: newNotes,
        });

      if (error) throw error;
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error saving notes",
        description: "There was an issue saving your notes.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAll = () => {
    toast({
      title: "All data saved",
      description: "Your daily tracking data is automatically saved.",
    });
  };

  const handleResetAll = async () => {
    if (!user) return;
    
    if (window.confirm("Are you sure you want to reset all data for today? This action cannot be undone.")) {
      try {
        // Delete entries
        await supabase
          .from('daily_entries')
          .delete()
          .eq('user_id', user.id)
          .eq('entry_date', today);

        // Delete/reset notes
        await supabase
          .from('daily_notes')
          .delete()
          .eq('user_id', user.id)
          .eq('entry_date', today);

        setEntries([]);
        setNotes("");
        
        toast({
          title: "Data reset",
          description: "All today's data has been cleared.",
          variant: "destructive",
        });
      } catch (error) {
        console.error('Error resetting data:', error);
        toast({
          title: "Error resetting data",
          description: "There was an issue clearing your data.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-2xl">🕌</span>
          </div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">🕌 My Dhikr</h1>
              <p className="text-white/90 text-sm sm:text-base">{todayFormatted}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin() && (
                <Button 
                  onClick={() => navigate('/admin')} 
                  variant="outline" 
                  className="text-white border-white/20 hover:bg-white/20"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button 
                onClick={() => navigate('/history')} 
                variant="outline" 
                className="text-white border-white/20 hover:bg-white/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                History
              </Button>
              <ChangePasswordDialog />
              <Button 
                onClick={signOut} 
                variant="outline" 
                className="text-white border-white/20 hover:bg-white/20"
              >
                Sign Out
              </Button>
            </div>
          </div>
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
        <DailySummary 
          entries={entries} 
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
        />

        {/* Notes Section */}
        <NotesSection 
          notes={notes} 
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
