import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, ArrowLeft, BarChart3 } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DailyEntry, DailySummary } from "@/components/daily-summary";
import { DailyReflections, DailyReflection } from "@/components/daily-reflections";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { worshipMatchKey } from "@/lib/worship-name";

interface HistoricalData {
  date: string;
  entries: DailyEntry[];
  notes: string;
  reflections: DailyReflection[];
  totalDhikr: number;
  totalQuran: number;
  totalSalah: number;
}

type WorshipType = "dhikr" | "quran" | "salah";

/**
 * One worship's total over the whole range — the number that was missing when
 * the same dhikr was logged five separate times in a day.
 */
interface ActivitySummary {
  key: string;
  name: string;
  count: number;
  type: WorshipType;
  /** How many separate times it was logged. */
  times: number;
  /** How many different days it was logged on. */
  days: number;
}

interface PeriodSummary {
  totalDhikr: number;
  totalQuran: number;
  totalSalah: number;
  activities: ActivitySummary[];
}

/** A worship the history can be narrowed to. */
interface WorshipOption {
  key: string;
  type: WorshipType;
  name: string;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  /** The worship filter — "all" means every worship. */
  const [selectedWorship, setSelectedWorship] = useState<string>("all");
  /** The category filter — "all" means all three. */
  const [selectedType, setSelectedType] = useState<string>("all");
  /** Every worship this member has ever logged, for the filter list. */
  const [worshipOptions, setWorshipOptions] = useState<WorshipOption[]>([]);

  const presetPeriods = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "this_week" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Last Week", value: "last_week" },
    { label: "This Month", value: "this_month" },
    { label: "Last 30 Days", value: "last_30_days" },
    { label: "Last Month", value: "last_month" },
    { label: "Year-to-Date", value: "year_to_date" },
    { label: "Last Year", value: "last_year" },
    { label: "All Time", value: "all_time" },
  ];

  // The filter list comes from every entry this member has ever logged, not
  // from the loaded range, so a worship can be picked even when the current
  // dates hold none of it.
  useEffect(() => {
    if (!user) return;

    const loadWorshipOptions = async () => {
      const { data: rows, error } = await supabase
        .from('daily_entries')
        .select('type,name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error || !rows) return;

      const seen = new Set<string>();
      const options: WorshipOption[] = [];
      const order: Record<string, number> = { dhikr: 0, quran: 1, salah: 2 };

      rows.forEach((row) => {
        const type = row.type as WorshipType;
        const key = `${type}-${worshipMatchKey(row.name)}`;
        if (!row.name || seen.has(key)) return;
        seen.add(key);
        options.push({ key, type, name: row.name });
      });

      options.sort((a, b) =>
        order[a.type] !== order[b.type]
          ? order[a.type] - order[b.type]
          : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setWorshipOptions(options);
    };

    loadWorshipOptions();
  }, [user]);

  const getDateRange = (period: string): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case "today":
        return { start: today, end: today };
      case "yesterday":
        const yesterday = subDays(today, 1);
        return { start: yesterday, end: yesterday };
      case "this_week":
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: today };
      case "last_7_days":
        return { start: subDays(today, 6), end: today };
      case "last_week":
        const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        const lastWeekEnd = subDays(startOfWeek(today, { weekStartsOn: 1 }), 1);
        return { start: lastWeekStart, end: lastWeekEnd };
      case "this_month":
        return { start: startOfMonth(today), end: today };
      case "last_30_days":
        return { start: subDays(today, 29), end: today };
      case "last_month":
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: subDays(startOfMonth(today), 1) };
      case "year_to_date":
        return { start: startOfYear(today), end: today };
      case "last_year":
        const lastYear = subYears(today, 1);
        return { start: startOfYear(lastYear), end: subDays(startOfYear(today), 1) };
      case "all_time":
        return { start: new Date(2000, 0, 1), end: today };
      default:
        return { start: today, end: today };
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const { start, end } = getDateRange(period);
    setStartDate(start);
    setEndDate(end);
  };

  const fetchHistoricalData = async () => {
    if (!user || !startDate || !endDate) return;
    
    setLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*, extra_info')
        .eq('user_id', user.id)
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Fetch notes (legacy)
      const { data: notesData, error: notesError } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr);

      if (notesError) throw notesError;

      // Fetch reflections
      const { data: reflectionsData, error: reflectionsError } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr)
        .order('created_at', { ascending: false });

      if (reflectionsError) throw reflectionsError;

      // Group data by date
      const groupedData: { [key: string]: HistoricalData } = {};
      
      // Process entries
      entriesData?.forEach(entry => {
        const date = entry.entry_date;
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            entries: [],
            notes: "",
            reflections: [],
            totalDhikr: 0,
            totalQuran: 0,
            totalSalah: 0,
          };
        }

        const transformedEntry: DailyEntry = {
          id: entry.id,
          type: entry.type as "dhikr" | "quran" | "salah",
          name: entry.name,
          count: entry.count,
          timestamp: entry.timestamp || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          extraInfo: entry.extra_info,
        };

        groupedData[date].entries.push(transformedEntry);

        // Update totals
        if (entry.type === 'dhikr') {
          groupedData[date].totalDhikr += entry.count;
        } else if (entry.type === 'quran') {
          groupedData[date].totalQuran += entry.count;
        } else if (entry.type === 'salah') {
          groupedData[date].totalSalah += entry.count;
        }
      });

      // Process notes (legacy)
      notesData?.forEach(note => {
        const date = note.entry_date;
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            entries: [],
            notes: "",
            reflections: [],
            totalDhikr: 0,
            totalQuran: 0,
            totalSalah: 0,
          };
        }
        groupedData[date].notes = note.notes || "";
      });

      // Process reflections
      reflectionsData?.forEach(reflection => {
        const date = reflection.entry_date;
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            entries: [],
            notes: "",
            reflections: [],
            totalDhikr: 0,
            totalQuran: 0,
            totalSalah: 0,
          };
        }
        groupedData[date].reflections.push(reflection);
      });

      // Convert to array and sort by date. Repeats of the same worship in a day
      // are merged into one line, the way the dashboard has always shown them.
      const dataArray = Object.values(groupedData)
        .map((day) => ({ ...day, entries: consolidateEntries(day.entries) }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setData(dataArray);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * The same worship logged several times in a day shown once, with the total
   * and the time of the most recent addition. Quran readings keep their verse
   * range separate, since a different range is genuinely a different reading.
   */
  const consolidateEntries = (entries: DailyEntry[]): DailyEntry[] => {
    const lines = new Map<string, DailyEntry>();

    // Rows arrive newest first, so the first one seen holds the time.
    entries.forEach((entry) => {
      const nameKey = worshipMatchKey(entry.name);
      const key = entry.type === 'quran' && entry.extraInfo
        ? `${entry.type}-${nameKey}-${entry.extraInfo}`
        : `${entry.type}-${nameKey}`;

      const existing = lines.get(key);
      if (existing) {
        existing.count += entry.count;
        existing.entryIds = [...(existing.entryIds || []), String(entry.id)];
        // The last spelling seen is the oldest: the line keeps the name it was
        // first given rather than being renamed by a later typo.
        existing.name = entry.name;
      } else {
        lines.set(key, { ...entry, entryIds: [String(entry.id)] });
      }
    });

    return Array.from(lines.values());
  };

  const matchesFilter = (entry: DailyEntry): boolean => {
    if (selectedType !== "all" && entry.type !== selectedType) return false;
    if (selectedWorship !== "all") {
      const worship = worshipOptions.find((option) => option.key === selectedWorship);
      if (!worship) return false;
      if (entry.type !== worship.type) return false;
      if (worshipMatchKey(entry.name) !== worshipMatchKey(worship.name)) return false;
    }
    return true;
  };

  /** The loaded data narrowed by the filter — no second trip to the server. */
  const filteredData: HistoricalData[] = data
    .map((day) => {
      const entries = day.entries.filter(matchesFilter);
      return {
        ...day,
        entries,
        totalDhikr: entries.filter((e) => e.type === 'dhikr').reduce((sum, e) => sum + e.count, 0),
        totalQuran: entries.filter((e) => e.type === 'quran').reduce((sum, e) => sum + e.count, 0),
        totalSalah: entries.filter((e) => e.type === 'salah').reduce((sum, e) => sum + e.count, 0),
      };
    })
    .filter((day) => day.entries.length > 0 || day.reflections.length > 0 || day.notes);

  const hasFilter = selectedWorship !== "all" || selectedType !== "all";

  const filterLabel = (() => {
    if (selectedWorship !== "all") {
      return worshipOptions.find((option) => option.key === selectedWorship)?.name ?? "All worships";
    }
    if (selectedType !== "all") return `All ${selectedType}`;
    return "All worships";
  })();

  const rangeLabel = startDate && endDate
    ? `${format(startDate, "d MMM yyyy")} – ${format(endDate, "d MMM yyyy")}`
    : "";

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dhikr': return 'text-emerald-600 bg-emerald-50';
      case 'quran': return 'text-blue-600 bg-blue-50';
      case 'salah': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dhikr': return '📿';
      case 'quran': return '📖';
      case 'salah': return '🕌';
      default: return '📝';
    }
  };

  /** Every row behind a summary line, so a merged line is edited or deleted whole. */
  const idsBehind = (id: string | number): string[] => {
    const line = data
      .flatMap((day) => day.entries)
      .find((entry) => String(entry.id) === String(id));
    return line?.entryIds?.length ? line.entryIds : [String(id)];
  };

  const handleEdit = async (id: string | number, newCount: number, newName: string) => {
    try {
      // When a line stands for several additions, the correction replaces all
      // of them — otherwise the others stay and the total goes back up.
      const olderIds = idsBehind(id).filter((entryId) => entryId !== String(id));

      if (olderIds.length > 0) {
        const { error: removeError } = await supabase
          .from('daily_entries')
          .delete()
          .in('id', olderIds);

        if (removeError) throw removeError;
      }

      const { error } = await supabase
        .from('daily_entries')
        .update({ 
          count: newCount,
          name: newName
        })
        .eq('id', String(id));

      if (error) throw error;

      toast.success("Entry updated successfully");
      fetchHistoricalData(); // Refresh data
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error("Failed to update entry");
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      // A line can stand for several additions of the same worship. Deleting it
      // has to remove all of them, or the rest quietly reappear with a smaller total.
      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .in('id', idsBehind(id));

      if (error) throw error;

      toast.success("Entry deleted successfully");
      fetchHistoricalData(); // Refresh data
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  const handleAddReflection = async (noteText: string, date: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .insert({
          user_id: user.id,
          entry_date: date,
          note_text: noteText,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Reflection added successfully");
      fetchHistoricalData();
    } catch (error) {
      console.error('Error adding reflection:', error);
      toast.error("Failed to add reflection");
    }
  };

  const handleEditReflection = async (id: string, noteText: string) => {
    try {
      const { error } = await supabase
        .from('daily_reflections')
        .update({ note_text: noteText })
        .eq('id', id);

      if (error) throw error;

      toast.success("Reflection updated successfully");
      fetchHistoricalData();
    } catch (error) {
      console.error('Error updating reflection:', error);
      toast.error("Failed to update reflection");
    }
  };

  const handleDeleteReflection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_reflections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Reflection deleted successfully");
      fetchHistoricalData();
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast.error("Failed to delete reflection");
    }
  };

  const calculatePeriodSummary = (days: HistoricalData[]): PeriodSummary => {
    const summary: PeriodSummary = {
      totalDhikr: 0,
      totalQuran: 0,
      totalSalah: 0,
      activities: []
    };

    // One line per worship, not one per category — keying on the category is
    // what hid the total of a single dhikr logged several times a day.
    const totals = new Map<string, ActivitySummary & { dates: Set<string> }>();

    days.forEach(dayData => {
      summary.totalDhikr += dayData.totalDhikr;
      summary.totalQuran += dayData.totalQuran;
      summary.totalSalah += dayData.totalSalah;

      dayData.entries.forEach(entry => {
        const key = `${entry.type}-${worshipMatchKey(entry.name)}`;
        const existing = totals.get(key);
        if (existing) {
          existing.count += entry.count;
          existing.times += entry.entryIds?.length ?? 1;
          existing.dates.add(dayData.date);
          existing.days = existing.dates.size;
          // The oldest spelling wins, as on the merged lines themselves.
          existing.name = entry.name;
        } else {
          totals.set(key, {
            key,
            name: entry.name,
            type: entry.type,
            count: entry.count,
            times: entry.entryIds?.length ?? 1,
            days: 1,
            dates: new Set([dayData.date]),
          });
        }
      });
    });

    summary.activities = Array.from(totals.values())
      .map(({ dates, ...activity }) => activity)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return summary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 safe-top safe-bottom">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await haptics.medium();
                navigate('/');
              }}
              className="rounded-full touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">History</h1>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Which worship */}
              <div className="space-y-2">
                <Label>Worship</Label>
                <Select
                  value={selectedWorship}
                  onValueChange={(value) => {
                    setSelectedWorship(value);
                    if (value !== "all") {
                      const picked = worshipOptions.find((option) => option.key === value);
                      if (picked && selectedType !== "all" && picked.type !== selectedType) {
                        setSelectedType("all");
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All worships" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All worships</SelectItem>
                    {(["dhikr", "quran", "salah"] as WorshipType[]).map((type) => {
                      const inType = worshipOptions.filter(
                        (option) => option.type === type && (selectedType === "all" || selectedType === type)
                      );
                      if (inType.length === 0) return null;
                      return (
                        <SelectGroup key={type}>
                          <SelectLabel>{getTypeIcon(type)} {type[0].toUpperCase() + type.slice(1)}</SelectLabel>
                          {inType.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Which category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value);
                    const picked = worshipOptions.find((option) => option.key === selectedWorship);
                    if (value !== "all" && picked && picked.type !== value) setSelectedWorship("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="dhikr">📿 Dhikr</SelectItem>
                    <SelectItem value="quran">📖 Quran</SelectItem>
                    <SelectItem value="salah">🕌 Salah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preset Periods */}
              <div className="space-y-2">
                <Label>Quick Periods</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setSelectedPeriod("");
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setSelectedPeriod("");
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={async () => {
                  await haptics.medium();
                  fetchHistoricalData();
                }} 
                disabled={!startDate || !endDate || loading}
                className="w-full md:w-auto touch-target"
              >
                {loading ? "Loading..." : "Load Data"}
              </Button>

              {hasFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWorship("all");
                    setSelectedType("all");
                  }}
                  className="w-full md:w-auto touch-target"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Period Summary */}
        {filteredData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedPeriod 
                  ? `${presetPeriods.find(p => p.value === selectedPeriod)?.label}'s Summary`
                  : 'Period Summary'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const summary = calculatePeriodSummary(filteredData);
                const focused = selectedWorship !== "all"
                  ? summary.activities.find((activity) => activity.key === selectedWorship)
                  : undefined;
                return (
                  <div className="space-y-6">
                    {/* One worship picked: its total for the whole range */}
                    {focused && (
                      <div className={cn("p-5 rounded-lg border", getTypeColor(focused.type))}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getTypeIcon(focused.type)}</span>
                          <div>
                            <h3 className="font-semibold">{filterLabel}</h3>
                            {rangeLabel && <p className="text-sm opacity-75">{rangeLabel}</p>}
                          </div>
                        </div>

                        <p className="text-4xl font-bold text-center mt-4">
                          {focused.count.toLocaleString()}
                        </p>
                        <p className="text-sm text-center opacity-75">
                          Total {focused.type} in this range
                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-current/20 text-center">
                          <div>
                            <p className="font-semibold">{focused.times.toLocaleString()}</p>
                            <p className="text-xs opacity-75">{focused.times === 1 ? "time logged" : "times logged"}</p>
                          </div>
                          <div>
                            <p className="font-semibold">{focused.days.toLocaleString()}</p>
                            <p className="text-xs opacity-75">{focused.days === 1 ? "day" : "days"}</p>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {Math.round(focused.count / Math.max(1, focused.days)).toLocaleString()}
                            </p>
                            <p className="text-xs opacity-75">avg / day</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overall Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">📿</span>
                          <h3 className="font-semibold text-emerald-800">Total Dhikr</h3>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">{summary.totalDhikr.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">📖</span>
                          <h3 className="font-semibold text-blue-800">Total Quran</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{summary.totalQuran.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🕌</span>
                          <h3 className="font-semibold text-purple-800">Total Nafl Salah</h3>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">{summary.totalSalah.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* One total per worship — tap one to filter by it */}
                    {summary.activities.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Total per worship</h3>
                        <div className="grid gap-2">
                          {summary.activities.map((activity) => (
                            <button
                              type="button"
                              key={activity.key}
                              onClick={() => {
                                const option = worshipOptions.find((o) => o.key === activity.key);
                                if (option) setSelectedWorship(option.key);
                              }}
                              className={cn(
                                "p-3 rounded-lg border flex items-center justify-between text-left w-full transition hover:brightness-95",
                                getTypeColor(activity.type)
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getTypeIcon(activity.type)}</span>
                                <div>
                                  <p className="font-medium">{activity.name}</p>
                                  <p className="text-xs opacity-75">
                                    {activity.times} {activity.times === 1 ? "time" : "times"} ·{" "}
                                    {activity.days} {activity.days === 1 ? "day" : "days"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-lg">×{activity.count.toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredData.length > 0 && (
          <div className="space-y-4">
            {filteredData.map((dayData) => (
              <Card key={dayData.date} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(new Date(dayData.date), 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-600">Dhikr: {dayData.totalDhikr.toLocaleString()}</span>
                      <span className="text-blue-600">Quran: {dayData.totalQuran.toLocaleString()}</span>
                      <span className="text-purple-600">Nafl Salah: {dayData.totalSalah.toLocaleString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Entries */}
                  {dayData.entries.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Activities</h4>
                      <DailySummary
                        entries={dayData.entries}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  )}

                  {/* Notes (legacy) */}
                  {dayData.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes (Legacy)</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{dayData.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Reflections */}
                  {dayData.reflections && dayData.reflections.length > 0 && (
                    <div>
                      <DailyReflections
                        reflections={dayData.reflections}
                        onAdd={(noteText) => handleAddReflection(noteText, dayData.date)}
                        onEdit={handleEditReflection}
                        onDelete={handleDeleteReflection}
                      />
                    </div>
                  )}

                  {/* Empty state */}
                  {dayData.entries.length === 0 && !dayData.notes && dayData.reflections.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No activities recorded for this day
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state when nothing matches */}
        {!loading && filteredData.length === 0 && startDate && endDate && (
          <Card>
            <CardContent className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">
                {hasFilter
                  ? `No ${filterLabel} ${rangeLabel ? `between ${rangeLabel}` : "in this period"}. Try a wider date range.`
                  : "No data found for the selected period."}
              </p>
              {hasFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWorship("all");
                    setSelectedType("all");
                  }}
                >
                  Show all worships
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;