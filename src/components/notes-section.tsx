import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function NotesSection({ notes, onNotesChange }: NotesSectionProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalNotes(notes);
    setHasUnsavedChanges(false);
  }, [notes]);

  const handleNotesChange = (value: string) => {
    setLocalNotes(value);
    setHasUnsavedChanges(value !== notes);
  };

  const handleSave = () => {
    onNotesChange(localNotes);
    setHasUnsavedChanges(false);
    toast({
      title: "Notes saved",
      description: "Your daily reflections have been saved.",
    });
  };

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000);

    return () => clearTimeout(timer);
  }, [localNotes, hasUnsavedChanges]);

  return (
    <div className="tracker-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">📝 Daily Notes & Reflections</h3>
        {hasUnsavedChanges && (
          <Button onClick={handleSave} className="success-button text-sm">
            Save Notes
          </Button>
        )}
      </div>
      
      <Textarea
        placeholder="Add any notes, duas, or reflections for today..."
        value={localNotes}
        onChange={(e) => handleNotesChange(e.target.value)}
        rows={4}
        className="w-full resize-none"
      />
      
      {hasUnsavedChanges && (
        <p className="text-xs text-muted-foreground mt-2">
          Auto-saving in 30 seconds or click Save Notes
        </p>
      )}
    </div>
  );
}