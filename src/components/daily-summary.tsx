import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SwipeableItem } from "@/components/ui/swipeable-item";
import { Edit3, Trash2, Save, X } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import { parseRange, displayRange, totalVersesInName, formatRange } from "@/lib/quran-range";
import { worshipMatchKey } from "@/lib/worship-name";

export interface DailyEntry {
  id: string | number;
  type: "dhikr" | "quran" | "salah";
  name: string;
  count: number;
  timestamp: string;
  extraInfo?: string; // For storing range info like "71 → 77"
  entryIds?: string[]; // Every row merged into this line
}

interface DailySummaryProps {
  entries: DailyEntry[];
  onEdit?: (id: string | number, newCount: number, newName: string, newExtraInfo?: string) => void;
  onDelete?: (id: string | number) => void;
}

export function DailySummary({ entries, onEdit, onDelete }: DailySummaryProps) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  // A Quran reading is corrected by its verses, not by a bare number — the
  // count is worked out from them, so the two can never disagree.
  const [editStart, setEditStart] = useState<string>("");
  const [editEnd, setEditEnd] = useState<string>("");
  const [editProblem, setEditProblem] = useState<string>("");
  const [editType, setEditType] = useState<DailyEntry["type"] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DailyEntry | null>(null);

  const handleEditStart = async (entry: DailyEntry) => {
    await haptics.light();
    sounds.tap();
    setEditingId(entry.id);
    setEditCount(entry.count);
    setEditName(entry.name);
    setEditType(entry.type);
    setEditProblem("");

    // Filled in with the verses the entry already holds — including rows the
    // phone wrote as `1_10` — so a wrong range is fixed, not retyped.
    const range = parseRange(entry.extraInfo, totalVersesInName(entry.name));
    setEditStart(range ? String(range.start) : "");
    setEditEnd(range ? String(range.end) : "");
  };

  /// The verses typed into the edit boxes, or the reason they cannot be used.
  const editedRange = () => {
    const total = totalVersesInName(editName);
    const start = parseInt(editStart, 10);
    const end = parseInt(editEnd, 10);

    if (!Number.isFinite(start) || start < 1) return { problem: "Type the verse you started at." };
    if (!Number.isFinite(end) || end < 1) return { problem: "Type the verse you stopped at." };
    if (end < start) return { problem: "The last verse can't come before the first one." };
    if (total > 0 && end > total) return { problem: `This surah only has ${total} verses.` };
    return { range: { start, end } };
  };

  /// The number that will be saved, before it is saved.
  const editingDisplayCount = () => {
    if (editType !== "quran") return editCount;
    const { range } = editedRange();
    return range ? range.end - range.start + 1 : 0;
  };

  const handleEditSave = async () => {
    if (!editingId || !onEdit) return;

    if (editType === "quran") {
      const { range, problem } = editedRange();
      if (!range) {
        setEditProblem(problem || "");
        await haptics.error();
        return;
      }
      await haptics.success();
      sounds.success();
      // The count comes from the verses, never typed beside them.
      onEdit(editingId, range.end - range.start + 1, editName, formatRange(range));
    } else {
      await haptics.success();
      sounds.success();
      onEdit(editingId, editCount, editName);
    }

    setEditingId(null);
    setEditProblem("");
  };

  const handleEditCancel = async () => {
    await haptics.light();
    sounds.tap();
    setEditingId(null);
    setEditCount(0);
    setEditName("");
  };

  const handleDeleteStart = async (entry: DailyEntry) => {
    await haptics.medium();
    sounds.tap();
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (entryToDelete && onDelete) {
      await haptics.heavy();
      sounds.delete();
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

  const typeIcon = (type: string) => {
    switch (type) {
      case "quran": return "📖";
      case "salah": return "🕌";
      default: return "📿";
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

  /**
   * Every entry of one worship under a single heading — An-Nisa read three
   * times is one card, not three cards all headed "An-Nisa". Quran was already
   * grouped this way; dhikr and salah are now too, so the day's total for a
   * worship is the headline and the individual additions sit underneath.
   *
   * Group order follows the first time each name appears, so a heading does
   * not jump about as more is added to an older one.
   */
  const groupEntries = (list: DailyEntry[]) => {
    const order: string[] = [];
    const byKey = new Map<string, DailyEntry[]>();

    list.forEach((entry) => {
      const key = `${entry.type}-${worshipMatchKey(entry.name)}`;
      if (!byKey.has(key)) {
        order.push(key);
        byKey.set(key, []);
      }
      byKey.get(key)!.push(entry);
    });

    return order.map((key) => {
      const groupEntries = byKey.get(key)!;
      return {
        key,
        type: groupEntries[0].type,
        name: groupEntries[0].name,
        entries: groupEntries,
        total: groupEntries.reduce((sum, e) => sum + e.count, 0),
        /**
         * Whether the entries underneath say anything the heading does not.
         * A lone count under its own name is the heading repeated; a lone
         * Quran reading still has to say which verses it was.
         */
        showsLines:
          groupEntries.length > 1 || Boolean(groupEntries[0].extraInfo),
      };
    });
  };

  const groups = groupEntries(entries);

  return (
    <div className="tracker-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Daily Summary</h3>
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {/* One card per worship, whatever its type */}
          {groups.map(({ key, type: groupType, name: surahName, entries: surahEntries, total, showsLines }) => (
            <motion.div 
              key={key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-2"
            >
            {/* Main Surah Header */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg shrink-0">{typeIcon(groupType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{surahName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`${getTypeColor(groupType)} text-xs whitespace-nowrap`}>
                      {formatType(groupType)}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {surahEntries.length} {surahEntries.length > 1 ? 'entries' : 'entry'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-primary shrink-0">
                ×{total.toLocaleString()}
              </div>
            </div>

            {/* The individual additions, small, under the heading */}
            {showsLines && surahEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  scale: editingId === entry.id ? 1.02 : 1,
                  y: 0
                }}
                exit={{ opacity: 0, x: -100, height: 0, transition: { duration: 0.25 } }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <SwipeableItem
                  onEdit={() => handleEditStart(entry)}
                  onDelete={() => handleDeleteStart(entry)}
                  className="ml-8"
                >
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30"
                >
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg shrink-0">{typeIcon(entry.type)}</span>
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
                        {editProblem && (
                          <p className="text-xs text-destructive">{editProblem}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {entry.type === 'quran' ? (
                            <>
                              <Input
                                aria-label="From verse"
                                type="number"
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                className="w-16 text-sm"
                                min="1"
                                placeholder="From"
                                autoComplete="off"
                              />
                              <span className="text-xs text-muted-foreground">→</span>
                              <Input
                                aria-label="To verse"
                                type="number"
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                className="w-16 text-sm"
                                min="1"
                                placeholder="To"
                                autoComplete="off"
                              />
                            </>
                          ) : (
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
                          )}
                          <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        {entry.extraInfo && (
                          <div className="text-sm text-foreground break-words">
                            {(() => {
                              // A reading saved on the phone reads `1_10`, so it
                              // is parsed rather than split on the arrow alone.
                              const range = parseRange(entry.extraInfo, totalVersesInName(entry.name));
                              if (!range) return <span>{entry.extraInfo}</span>;
                              return (
                                <span>
                                  {displayRange(range)} ({entry.count.toLocaleString()} verses)
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
                      <span className="text-lg sm:text-xl font-bold text-primary mr-2 shrink-0">{editingDisplayCount().toLocaleString()}</span>
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
              </motion.div>
            ))}
          </motion.div>
        ))}

        </div>
      </AnimatePresence>

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