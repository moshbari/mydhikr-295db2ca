import { useState, useEffect } from "react";
import { TrackerSection } from "@/components/tracker-section";
import { DailySummary, DailyEntry } from "@/components/daily-summary";
import { DailyReflections, DailyReflection } from "@/components/daily-reflections";
import { ReflectionsSection } from "@/components/reflections-section";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { getCurrentHijriDate, formatHijriDate } from "@/lib/hijri-calendar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

import { BarChart3, Shield, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { createAdminAccounts } from "@/lib/admin-setup";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  
  const today = format(selectedDate, 'yyyy-MM-dd');
  const todayFormatted = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const hijriDate = getCurrentHijriDate();
  const hijriFormatted = formatHijriDate(hijriDate);

  // Create admin accounts on component mount
  useEffect(() => {
    createAdminAccounts();
  }, []);

  // Load today's data from database
  const loadTodayData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
        // Load entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('daily_entries')
          .select('*, extra_info')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .order('created_at', { ascending: false });

        if (entriesError) throw entriesError;

        // Transform database entries to match component format and consolidate duplicates
        const entriesMap = new Map();
        
        (entriesData || []).forEach(entry => {
          // For Quran entries, include extra_info in the key to keep different verse ranges separate
          const key = entry.type === 'quran' && entry.extra_info 
            ? `${entry.type}-${entry.name}-${entry.extra_info}`
            : `${entry.type}-${entry.name}`;
          const timestamp = entry.timestamp || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          if (entriesMap.has(key)) {
            // If entry exists, add to count and use latest timestamp
            const existing = entriesMap.get(key);
            existing.count += entry.count;
            // Keep the latest timestamp (entries are ordered by created_at desc)
            if (entry.created_at > existing.created_at) {
              existing.timestamp = timestamp;
              existing.id = entry.id; // Use the latest entry's ID
              existing.created_at = entry.created_at;
            }
          } else {
            // New entry
            entriesMap.set(key, {
              id: entry.id,
              type: entry.type as "dhikr" | "quran" | "salah",
              name: entry.name,
              count: entry.count,
              timestamp: timestamp,
              created_at: entry.created_at,
              extraInfo: entry.extra_info,
            });
          }
        });

        const transformedEntries: DailyEntry[] = Array.from(entriesMap.values()).map(entry => ({
          id: entry.id,
          type: entry.type,
          name: entry.name,
          count: entry.count,
          timestamp: entry.timestamp,
          extraInfo: entry.extraInfo,
        }));

        setEntries(transformedEntries);

        // Load reflections
        const { data: reflectionsData, error: reflectionsError } = await supabase
          .from('daily_reflections')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .order('created_at', { ascending: false });

        if (reflectionsError) throw reflectionsError;
        setReflections(reflectionsData || []);

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

  useEffect(() => {
    loadTodayData();
  }, [user, today, toast, selectedDate]);

  const addEntry = async (type: "dhikr" | "quran" | "salah", name: string, count: number, extraInfo?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track your activities.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if entry with same type, name, and extraInfo (verse range) already exists today
      const existingEntry = entries.find(entry => 
        entry.type === type && 
        entry.name === name && 
        (type !== "quran" || entry.extraInfo === extraInfo)
      );

      if (existingEntry) {
        // Update existing entry by adding the new count
        const newCount = existingEntry.count + count;
        
        const currentTime = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        const { error } = await supabase
          .from('daily_entries')
          .update({
            count: newCount,
            timestamp: currentTime,
            created_at: new Date().toISOString(), // Update created_at to reflect last update time
          })
          .eq('id', String(existingEntry.id))
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setEntries(prev => 
          prev.map(entry => 
            entry.id === existingEntry.id 
              ? { ...entry, count: newCount, timestamp: currentTime }
              : entry
          )
        );

        toast({
          title: "Entry updated",
          description: `${name}: ${count} added (total: ${newCount})`,
        });
      } else {
        // Create new entry
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
            extra_info: extraInfo,
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
          extraInfo: extraInfo,
        };

        setEntries(prev => [newEntry, ...prev]);

        toast({
          title: "Entry added",
          description: `${name}: ${count} recorded`,
        });
      }
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

  const handleAddReflection = async (noteText: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .insert({
          user_id: user.id,
          entry_date: today,
          note_text: noteText,
        })
        .select()
        .single();

      if (error) throw error;

      setReflections(prev => [data, ...prev]);

      toast({
        title: "Reflection added",
        description: "Your note has been saved.",
      });
    } catch (error) {
      console.error('Error adding reflection:', error);
      toast({
        title: "Error adding reflection",
        description: "There was an issue saving your note.",
        variant: "destructive",
      });
    }
  };

  const handleEditReflection = async (id: string, noteText: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('daily_reflections')
        .update({ note_text: noteText })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReflections(prev => 
        prev.map(reflection => 
          reflection.id === id 
            ? { ...reflection, note_text: noteText, updated_at: new Date().toISOString() }
            : reflection
        )
      );

      toast({
        title: "Reflection updated",
        description: "Your note has been updated.",
      });
    } catch (error) {
      console.error('Error updating reflection:', error);
      toast({
        title: "Error updating reflection",
        description: "There was an issue updating your note.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReflection = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('daily_reflections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReflections(prev => prev.filter(reflection => reflection.id !== id));

      toast({
        title: "Reflection deleted",
        description: "Your note has been removed.",
      });
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast({
        title: "Error deleting reflection",
        description: "There was an issue deleting your note.",
        variant: "destructive",
      });
    }
  };

  const handleResetAll = async () => {
    if (!user) return;
    
    await haptics.warning();
    if (window.confirm("Are you sure you want to reset all data for today? This action cannot be undone.")) {
      await haptics.heavy();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="header-gradient text-white py-4 px-3 sm:py-6 sm:px-4 safe-top">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">🕌 My Dhikr</h1>
              <div className="text-white/90 text-xs sm:text-sm">
                <p className="font-medium">{todayFormatted}</p>
                <p className="text-white/80 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>{hijriFormatted}</p>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {isAdmin() && (
                <Button 
                  onClick={async () => {
                    await haptics.medium();
                    navigate('/admin');
                  }} 
                  variant="header"
                  size="mobile"
                  className="touch-target"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                onClick={async () => {
                  await haptics.medium();
                  navigate('/history');
                }} 
                variant="header"
                size="mobile"
                className="touch-target"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <div className="flex">
                <ChangePasswordDialog />
              </div>
              <Button 
                onClick={async () => {
                  await haptics.medium();
                  signOut();
                }} 
                variant="header"
                size="mobile"
                className="touch-target"
              >
                <span className="text-xs sm:text-sm">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - use natural page scrolling for better mobile support */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Date Selector */}
          <div className="flex justify-center mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-auto justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Daily Summary */}
          <DailySummary 
            entries={entries} 
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />

          {/* Dhikr & Tasbih Section */}
          <TrackerSection
            title="Dhikr & Tasbih"
            icon="📿"
            type="dhikr"
            onAdd={(name, count) => addEntry("dhikr", name, count)}
          />

          {/* Quran Recitation Section */}
          <TrackerSection
            title="Quran Recitation"
            icon="📖"
            type="quran"
            onAdd={(name, count, extraInfo) => addEntry("quran", name, count, extraInfo)}
          />

          {/* Nafl Salah Section */}
          <TrackerSection
            title="Nafl Salah"
            icon="🤲"
            type="salah"
            onAdd={(name, count) => addEntry("salah", name, count)}
          />

          {/* Daily Reflections */}
          <DailyReflections
            reflections={reflections}
            onAdd={handleAddReflection}
            onEdit={handleEditReflection}
            onDelete={handleDeleteReflection}
          />

          {/* Reset Controls */}
          <div className="tracker-card">
            <div className="flex justify-center">
              <Button onClick={handleResetAll} variant="destructive" className="touch-target">
                🔄 Reset All Data
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground safe-bottom">
        <p className="text-sm">May Allah accept your worship and grant you success</p>
      </footer>
    </div>
  );
};

export default Index;
