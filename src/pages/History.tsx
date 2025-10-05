import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ArrowLeft, BarChart3 } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DailyEntry, DailySummary } from "@/components/daily-summary";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HistoricalData {
  date: string;
  entries: DailyEntry[];
  notes: string;
  totalDhikr: number;
  totalQuran: number;
  totalSalah: number;
}

interface ActivitySummary {
  name: string;
  count: number;
  type: "dhikr" | "quran" | "salah";
}

interface PeriodSummary {
  totalDhikr: number;
  totalQuran: number;
  totalSalah: number;
  activities: ActivitySummary[];
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const presetPeriods = [
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

  const getDateRange = (period: string): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
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

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr);

      if (notesError) throw notesError;

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

      // Process notes
      notesData?.forEach(note => {
        const date = note.entry_date;
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            entries: [],
            notes: "",
            totalDhikr: 0,
            totalQuran: 0,
            totalSalah: 0,
          };
        }
        groupedData[date].notes = note.notes || "";
      });

      // Convert to array and sort by date
      const dataArray = Object.values(groupedData).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setData(dataArray);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = async (id: string, newCount: number, newName: string) => {
    try {
      const { error } = await supabase
        .from('daily_entries')
        .update({ 
          count: newCount,
          name: newName
        })
        .eq('id', id);

      if (error) throw error;

      toast.success("Entry updated successfully");
      fetchHistoricalData(); // Refresh data
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error("Failed to update entry");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Entry deleted successfully");
      fetchHistoricalData(); // Refresh data
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  const calculatePeriodSummary = (data: HistoricalData[]): PeriodSummary => {
    const summary: PeriodSummary = {
      totalDhikr: 0,
      totalQuran: 0,
      totalSalah: 0,
      activities: []
    };

    const activityTotals: { [key: string]: { count: number; type: "dhikr" | "quran" | "salah" } } = {};

    data.forEach(dayData => {
      summary.totalDhikr += dayData.totalDhikr;
      summary.totalQuran += dayData.totalQuran;
      summary.totalSalah += dayData.totalSalah;

      dayData.entries.forEach(entry => {
        const key = `${entry.type}-${entry.name}`;
        if (!activityTotals[key]) {
          activityTotals[key] = { count: 0, type: entry.type };
        }
        activityTotals[key].count += entry.count;
      });
    });

    // Convert to array and sort by count descending
    summary.activities = Object.entries(activityTotals)
      .map(([key, value]) => ({
        name: key.split('-').slice(1).join('-'),
        count: value.count,
        type: value.type
      }))
      .sort((a, b) => b.count - a.count);

    return summary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
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

            <Button 
              onClick={fetchHistoricalData} 
              disabled={!startDate || !endDate || loading}
              className="w-full md:w-auto"
            >
              {loading ? "Loading..." : "Load Data"}
            </Button>
          </CardContent>
        </Card>

        {/* Period Summary */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Period Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const summary = calculatePeriodSummary(data);
                return (
                  <div className="space-y-6">
                    {/* Overall Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">📿</span>
                          <h3 className="font-semibold text-emerald-800">Total Dhikr</h3>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">{summary.totalDhikr}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">📖</span>
                          <h3 className="font-semibold text-blue-800">Total Quran</h3>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{summary.totalQuran}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🕌</span>
                          <h3 className="font-semibold text-purple-800">Total Salah</h3>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">{summary.totalSalah}</p>
                      </div>
                    </div>

                    {/* Activity Breakdown */}
                    {summary.activities.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Activity Breakdown</h3>
                        <div className="grid gap-2">
                          {summary.activities.map((activity, index) => (
                            <div
                              key={`${activity.type}-${activity.name}-${index}`}
                              className={cn(
                                "p-3 rounded-lg border flex items-center justify-between",
                                getTypeColor(activity.type)
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getTypeIcon(activity.type)}</span>
                                <span className="font-medium capitalize">{activity.type}</span>
                                <span className="text-sm opacity-75">• {activity.name}</span>
                              </div>
                              <span className="font-bold text-lg">×{activity.count}</span>
                            </div>
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
        {data.length > 0 && (
          <div className="space-y-4">
            {data.map((dayData) => (
              <Card key={dayData.date} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(new Date(dayData.date), 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-600">Dhikr: {dayData.totalDhikr}</span>
                      <span className="text-blue-600">Quran: {dayData.totalQuran}</span>
                      <span className="text-purple-600">Salah: {dayData.totalSalah}</span>
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

                  {/* Notes */}
                  {dayData.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{dayData.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {dayData.entries.length === 0 && !dayData.notes && (
                    <p className="text-center text-muted-foreground py-4">
                      No activities recorded for this day
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state when no data loaded */}
        {!loading && data.length === 0 && startDate && endDate && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No data found for the selected period.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;