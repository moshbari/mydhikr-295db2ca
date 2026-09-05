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
import { sounds } from "@/lib/sounds";

import { BarChart3, Shield, CalendarIcon, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { createAdminAccounts } from "@/lib/admin-setup";
import { worshipMatchKey } from "@/lib/worship-name";
import { normalizeRangeKey } from "@/lib/quran-range";

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
          const nameKey = worshipMatchKey(entry.name);
          // `1_10` from the phone and `1 → 10` from here are the same ten
          // verses, so they belong on one line.
          const key = entry.type === 'quran' && entry.extra_info 
            ? `${entry.type}-${nameKey}-${normalizeRangeKey(entry.extra_info, entry.name)}`
            : `${entry.type}-${nameKey}`;
          const timestamp = entry.timestamp || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          if (entriesMap.has(key)) {
            // If entry exists, add to count and use latest timestamp
            const existing = entriesMap.get(key);
            existing.count += entry.count;
            existing.entryIds.push(entry.id);
            // Rows arrive newest first, so the last spelling seen is the oldest:
            // the line keeps the name it was first given.
            existing.name = entry.name;
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
              entryIds: [entry.id],
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
          entryIds: entry.entryIds,
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
      // Every addition is its own row, the way the phone has always saved
      // them. They used to be folded into one row here, so fifteen rak'ah at
      // one o'clock and seven at twenty past became a single 22 with no way
      // to see — or correct — either half. The summary groups them under one
      // heading now, so the detail costs nothing to keep.
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
      
      sounds.add();
      await haptics.success();
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

  const handleEditEntry = async (id: string | number, newCount: number, newName: string, newExtraInfo?: string) => {
    if (!user) return;

    try {
      // When a line stands for several additions, the correction replaces all
      // of them — otherwise the others stay and the total goes back up.
      const line = entries.find(entry => entry.id === id);
      const ids = line?.entryIds?.length ? line.entryIds : [String(id)];
      const olderIds = ids.filter(entryId => entryId !== String(id));

      if (olderIds.length > 0) {
        const { error: removeError } = await supabase
          .from('daily_entries')
          .delete()
          .in('id', olderIds)
          .eq('user_id', user.id);

        if (removeError) throw removeError;
      }

      const { error } = await supabase
        .from('daily_entries')
        .update({
          count: newCount,
          name: newName,
          // Correcting a Quran reading changes which verses it was, not just
          // how many — leaving the old range behind would make the card
          // contradict its own number.
          ...(newExtraInfo ? { extra_info: newExtraInfo } : {}),
        })
        .eq('id', String(id))
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setEntries(prev =>
        prev.map(entry =>
          entry.id === id
            ? { ...entry, count: newCount, name: newName, entryIds: [String(id)], extraInfo: newExtraInfo ?? entry.extraInfo }
            : entry
        )
      );

      sounds.success();
      await haptics.success();
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
      // A summary line can stand for several additions of the same worship.
      // Deleting it has to remove all of them, or the rest quietly reappear.
      const line = entries.find(entry => entry.id === id);
      const ids = line?.entryIds?.length ? line.entryIds : [String(id)];

      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== id));

      sounds.delete();
      await haptics.success();
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
    <div className="min-h-screen bg-background p-4 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <header className="header-gradient text-white py-5 px-4 sm:py-7 sm:px-6 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Title and Date Section */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 drop-shadow-md">🕌 My Dhikr</h1>
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-semibold text-white/95">{todayFormatted}</p>
                <p className="text-sm sm:text-base text-white/85" style={{ fontFamily: 'Arial, sans-serif' }}>{hijriFormatted}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              {isAdmin() && (
                <Button 
                  onClick={async () => {
                    await haptics.medium();
                    sounds.navigate();
                    navigate('/admin');
                  }} 
                  variant="ghost"
                  className="header-button flex-1 sm:flex-none"
                >
                  <Shield className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                onClick={async () => {
                  await haptics.medium();
                  sounds.navigate();
                  navigate('/history');
                }} 
                variant="ghost"
                className="header-button flex-1 sm:flex-none"
              >
                <BarChart3 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <ChangePasswordDialog />
              <Button 
                onClick={async () => {
                  await haptics.medium();
                  sounds.tap();
                  signOut();
                }} 
                variant="ghost"
                className="header-button flex-1 sm:flex-none"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-6">
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
              onQuickAdd={(type, name, count) => addEntry(type, name, count)}
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

            {/* Last Read Section */}
            <div className="tracker-card">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
                📚 Last Read
              </h2>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    await haptics.medium();
                    sounds.navigate();
                    navigate('/sura-yasin-last-read');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity touch-target"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Surah Yasin</span>
                  </div>
                  <span className="text-sm opacity-80">Track Progress →</span>
                </button>
                <button
                  onClick={async () => {
                    await haptics.medium();
                    sounds.navigate();
                    navigate('/sura-waqiah-last-read');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#dc3545] to-[#c82333] text-white rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity touch-target"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Surah Al-Waqiah</span>
                  </div>
                  <span className="text-sm opacity-80">Track Progress →</span>
                </button>
                <button
                  onClick={async () => {
                    await haptics.medium();
                    sounds.navigate();
                    navigate('/sura-kahf-last-read');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#2d5016] to-[#4a7c23] text-white rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity touch-target"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Surah Al-Kahf</span>
                  </div>
                  <span className="text-sm opacity-80">Track Progress →</span>
                </button>
                <button
                  onClick={async () => {
                    await haptics.medium();
                    sounds.navigate();
                    navigate('/sura-mulk-last-read');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white rounded-lg flex items-center justify-between hover:opacity-90 transition-opacity touch-target"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Surah Al-Mulk</span>
                  </div>
                  <span className="text-sm opacity-80">Track Progress →</span>
                </button>
              </div>
            </div>

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

          {/* Footer */}
          <footer className="text-center py-6 text-muted-foreground">
            <p className="text-sm">May Allah accept your worship and grant you success</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Index;
