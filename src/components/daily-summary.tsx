import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SwipeableItem } from "@/components/ui/swipeable-item";
import { Edit3, Trash2, Save, X } from "lucide-react";
import { haptics } from "@/lib/haptics";

export interface DailyEntry {
  id: string | number;
  type: "dhikr" | "quran" | "salah";
  name: string;
  count: number;
  timestamp: string;
  extraInfo?: string; // For storing range info like "71 → 77"
}

interface DailySummaryProps {
  entries: DailyEntry[];
  onEdit?: (id: string | number, newCount: number, newName: string) => void;
  onDelete?: (id: string | number) => void;
}

export function DailySummary({ entries, onEdit, onDelete }: DailySummaryProps) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DailyEntry | null>(null);

  const handleEditStart = async (entry: DailyEntry) => {
    await haptics.light();
    setEditingId(entry.id);
    setEditCount(entry.count);
    setEditName(entry.name);
  };

  const handleEditSave = async () => {
    if (editingId && onEdit) {
      await haptics.success();
      onEdit(editingId, editCount, editName);
      setEditingId(null);
    }
  };

  const handleEditCancel = async () => {
    await haptics.light();
    setEditingId(null);
    setEditCount(0);
    setEditName("");
  };

  const handleDeleteStart = async (entry: DailyEntry) => {
    await haptics.medium();
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (entryToDelete && onDelete) {
      await haptics.heavy();
      onDelete(entryToDelete.id);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };
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
        return "Nafl Salah";
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

  // Group Quran entries by surah name
  const groupQuranEntries = (entries: DailyEntry[]) => {
    const quranEntries = entries.filter(entry => entry.type === "quran");
    const otherEntries = entries.filter(entry => entry.type !== "quran");
    
    const quranGroups = quranEntries.reduce((groups, entry) => {
      const surahName = entry.name;
      if (!groups[surahName]) {
        groups[surahName] = [];
      }
      groups[surahName].push(entry);
      return groups;
    }, {} as Record<string, DailyEntry[]>);
    
    return { quranGroups, otherEntries };
  };

  const { quranGroups, otherEntries } = groupQuranEntries(entries);

  return (
    <div className="tracker-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Daily Summary</h3>
      <div className="space-y-3">
        {/* Render grouped Quran entries */}
        {Object.entries(quranGroups).map(([surahName, surahEntries]) => (
          <div key={surahName} className="space-y-2">
            {/* Main Surah Header */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg shrink-0">📖</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{surahName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-accent text-accent-foreground text-xs whitespace-nowrap">
                      Quran
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {surahEntries.length} session{surahEntries.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-primary shrink-0">
                {surahEntries.reduce((total, entry) => total + entry.count, 0).toLocaleString()}
              </div>
            </div>

            {/* Sub-entries for each verse range */}
            {surahEntries.map((entry) => (
              <SwipeableItem
                key={entry.id}
                onEdit={() => handleEditStart(entry)}
                onDelete={() => handleDeleteStart(entry)}
                className="ml-8"
              >
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30"
                >
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg shrink-0">📿</span>
                  <div className="flex-1 min-w-0">
                    {editingId === entry.id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        <Input
                          id={`edit-name-${entry.id}`}
                          name={`editName-${entry.id}`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm"
                          placeholder="Activity name"
                          autoComplete="off"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            id={`edit-count-${entry.id}`}
                            name={`editCount-${entry.id}`}
                            type="number"
                            value={editCount}
                            onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                            className="w-20 text-sm"
                            min="1"
                            autoComplete="off"
                          />
                          <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        {entry.extraInfo && (
                          <div className="text-sm text-foreground break-words">
                            {(() => {
                              const [start, end] = entry.extraInfo.split(' → ').map(v => v.trim());
                              return (
                                <span>
                                  Verses {start} → {end} ({entry.count.toLocaleString()} verses)
                                </span>
                              );
                            })()}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {editingId === entry.id ? (
                    // Edit Mode Actions
                    <div className="flex items-center gap-1">
                      <span className="text-lg sm:text-xl font-bold text-primary mr-2 shrink-0">{editCount.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditSave}
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditCancel}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // View Mode Actions
                    <div className="flex items-center gap-1">
                      <span className="text-lg sm:text-xl font-bold text-primary mr-2 shrink-0">{entry.count.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditStart(entry)}
                        className="h-8 w-8 p-0 touch-target"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStart(entry)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive touch-target"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              </SwipeableItem>
            ))}
          </div>
        ))}

        {/* Render other entries (Dhikr, Salah) normally */}
        {otherEntries.map((entry) => (
          <SwipeableItem
            key={entry.id}
            onEdit={() => handleEditStart(entry)}
            onDelete={() => handleDeleteStart(entry)}
          >
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
            >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-lg shrink-0">{getTypeIcon(entry.type)}</span>
              <div className="flex-1 min-w-0">
                {editingId === entry.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <Input
                      id={`edit-name-${entry.id}`}
                      name={`editName-${entry.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm"
                      placeholder="Activity name"
                      autoComplete="off"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        id={`edit-count-${entry.id}`}
                        name={`editCount-${entry.id}`}
                        type="number"
                        value={editCount}
                        onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                        className="w-20 text-sm"
                        min="1"
                        autoComplete="off"
                      />
                      <Badge className={getTypeColor(entry.type)}>
                        {formatType(entry.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {entry.name}
                      {entry.type === 'quran' && entry.extraInfo && (
                        <span className="ml-1 text-xs opacity-60">
                          (verses {entry.extraInfo.replace(' → ', '-')})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={`${getTypeColor(entry.type)} text-xs whitespace-nowrap`}>
                        {formatType(entry.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {editingId === entry.id ? (
                // Edit Mode Actions
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-xl font-bold text-primary mr-2 shrink-0">{editCount.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditSave}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // View Mode Actions
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-xl font-bold text-primary mr-2 shrink-0">{entry.count.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditStart(entry)}
                    className="h-8 w-8 p-0 touch-target"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteStart(entry)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive touch-target"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          </SwipeableItem>
        ))}
      </div>

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheet
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Entry?"
        description="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Are you sure you want to delete this {entryToDelete && formatType(entryToDelete.type).toLowerCase()} entry for "{entryToDelete?.name}"?
          </p>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={async () => {
                await haptics.light();
                setDeleteDialogOpen(false);
              }}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="flex-1 touch-target"
            >
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}