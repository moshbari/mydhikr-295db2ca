import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit3, Trash2, Save, X, Plus } from "lucide-react";
import { format } from "date-fns";

export interface DailyReflection {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

interface DailyReflectionsProps {
  reflections: DailyReflection[];
  onAdd: (noteText: string) => void;
  onEdit?: (id: string, noteText: string) => void;
  onDelete?: (id: string) => void;
}

export function DailyReflections({ reflections, onAdd, onEdit, onDelete }: DailyReflectionsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  const handleEditStart = (reflection: DailyReflection) => {
    setEditingId(reflection.id);
    setEditText(reflection.note_text);
  };

  const handleEditSave = () => {
    if (editingId && onEdit && editText.trim()) {
      onEdit(editingId, editText);
      setEditingId(null);
      setEditText("");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleAddStart = () => {
    setIsAdding(true);
    setNewNoteText("");
  };

  const handleAddSave = () => {
    if (newNoteText.trim()) {
      onAdd(newNoteText);
      setIsAdding(false);
      setNewNoteText("");
    }
  };

  const handleAddCancel = () => {
    setIsAdding(false);
    setNewNoteText("");
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">📝 Daily Notes & Reflections</h3>
        {!isAdding && (
          <Button onClick={handleAddStart} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Add New Note Form */}
        {isAdding && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <Textarea
              id="new-note"
              name="newNote"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Write your note or reflection..."
              rows={3}
              className="w-full resize-none mb-3"
              autoComplete="off"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddSave}
                disabled={!newNoteText.trim()}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Existing Reflections */}
        {reflections.length === 0 && !isAdding && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-muted-foreground">No reflections yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Note" to start</p>
          </div>
        )}

        {reflections.map((reflection) => (
          <div
            key={reflection.id}
            className="p-4 bg-muted/30 rounded-lg border border-border/50"
          >
            {editingId === reflection.id ? (
              // Edit Mode
              <div className="space-y-3">
                <Textarea
                  id={`edit-note-${reflection.id}`}
                  name={`editNote-${reflection.id}`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Added at {formatTime(reflection.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditCancel}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      disabled={!editText.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-3">
                <p className="text-foreground whitespace-pre-wrap">{reflection.note_text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Added at {formatTime(reflection.created_at)}</span>
                    {reflection.updated_at !== reflection.created_at && (
                      <span className="opacity-75">• Edited</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditStart(reflection)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this reflection? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete?.(reflection.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
