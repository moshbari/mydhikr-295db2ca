import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit3, Trash2, Save, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Reflection {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export function ReflectionsSection() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchReflections = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reflections:', error);
      return;
    }

    setReflections(data || []);
  };

  useEffect(() => {
    fetchReflections();
  }, [user]);

  const handleAddReflection = async () => {
    if (!user || !newNote.trim()) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const { error } = await supabase
      .from('daily_reflections')
      .insert({
        user_id: user.id,
        entry_date: today,
        note_text: newNote.trim()
      });

    if (error) {
      console.error('Error adding reflection:', error);
      toast.error("Failed to add reflection");
      return;
    }

    toast.success("Reflection added");
    setNewNote("");
    setIsAdding(false);
    fetchReflections();
  };

  const handleEditStart = (reflection: Reflection) => {
    setEditingId(reflection.id);
    setEditText(reflection.note_text);
  };

  const handleEditSave = async () => {
    if (!editingId || !editText.trim()) return;

    const { error } = await supabase
      .from('daily_reflections')
      .update({ note_text: editText.trim() })
      .eq('id', editingId);

    if (error) {
      console.error('Error updating reflection:', error);
      toast.error("Failed to update reflection");
      return;
    }

    toast.success("Reflection updated");
    setEditingId(null);
    setEditText("");
    fetchReflections();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('daily_reflections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reflection:', error);
      toast.error("Failed to delete reflection");
      return;
    }

    toast.success("Reflection deleted");
    fetchReflections();
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <div className="tracker-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">📝 Daily Notes & Reflections</h3>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="islamic-button text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add new reflection */}
      {isAdding && (
        <Card className="p-3 mb-4 bg-muted/30">
          <Textarea
            id="new-reflection"
            name="newReflection"
            placeholder="Add any notes, duas, or reflections for today..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="w-full resize-none mb-2"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddReflection}
              disabled={!newNote.trim()}
              className="success-button text-sm"
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewNote("");
              }}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Display existing reflections */}
      <div className="space-y-3">
        {reflections.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No reflections yet today</p>
            <p className="text-xs mt-1">Click "Add Note" to create your first reflection</p>
          </div>
        )}

        {reflections.map((reflection) => (
          <Card key={reflection.id} className="p-3 bg-muted/20">
            {editingId === reflection.id ? (
              // Edit mode
              <div>
                <Textarea
                  id={`edit-reflection-${reflection.id}`}
                  name={`editReflection-${reflection.id}`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full resize-none mb-2"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Added at {formatTime(reflection.created_at)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEditSave}
                      disabled={!editText.trim()}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <p className="text-sm whitespace-pre-wrap mb-2">{reflection.note_text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Added at {formatTime(reflection.created_at)}
                    {reflection.updated_at !== reflection.created_at && (
                      <span className="ml-2">(edited)</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleEditStart(reflection)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
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
                            onClick={() => handleDelete(reflection.id)}
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
          </Card>
        ))}
      </div>
    </div>
  );
}
