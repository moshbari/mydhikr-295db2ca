import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowUp, ArrowDown, Edit3, Trash2, Plus, Save, X } from "lucide-react";
import { useIslamicOptions, IslamicOption } from "@/hooks/use-islamic-options";

export const IslamicOptionsManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<'dhikr' | 'quran' | 'salah'>('dhikr');
  const { options, loading, addOption, updateOption, deleteOption, reorderOptions } = useIslamicOptions(selectedCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const categoryOptions = options.filter(opt => opt.category === selectedCategory);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...categoryOptions];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    reorderOptions(newOptions);
  };

  const handleMoveDown = (index: number) => {
    if (index === categoryOptions.length - 1) return;
    const newOptions = [...categoryOptions];
    [newOptions[index + 1], newOptions[index]] = [newOptions[index], newOptions[index + 1]];
    reorderOptions(newOptions);
  };

  const handleStartEdit = (option: IslamicOption) => {
    setEditingId(option.id);
    setEditValue(option.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateOption(editingId, editValue.trim());
      setEditingId(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleAddNew = () => {
    if (newItemName.trim()) {
      addOption(newItemName.trim(), selectedCategory);
      setNewItemName("");
      setShowAddForm(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'dhikr': return 'Dhikr & Tasbih';
      case 'quran': return 'Quran Reading';
      case 'salah': return 'Nafl Salah';
      default: return cat;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Manage Islamic Options</span>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selector */}
        <div>
          <Label htmlFor="category">Select Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value: 'dhikr' | 'quran' | 'salah') => {
              setSelectedCategory(value);
              setShowAddForm(false);
              setEditingId(null);
            }}
          >
            <SelectTrigger id="category" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dhikr">Dhikr & Tasbih</SelectItem>
              <SelectItem value="quran">Quran Reading</SelectItem>
              <SelectItem value="salah">Nafl Salah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add New Item Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <h3 className="font-semibold">Add New {getCategoryLabel(selectedCategory)} Item</h3>
            <div>
              <Label htmlFor="new_item">Item Name</Label>
              <Input
                id="new_item"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Enter item name"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNew} disabled={!newItemName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setNewItemName("");
              }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">
            {getCategoryLabel(selectedCategory)} Items ({categoryOptions.length})
          </h3>
          
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : categoryOptions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No items found</p>
          ) : (
            <div className="space-y-2">
              {categoryOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 p-3 border rounded-lg bg-background"
                >
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === categoryOptions.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Order Number */}
                  <div className="text-sm font-medium text-muted-foreground w-8">
                    {index + 1}.
                  </div>

                  {/* Name (editable) */}
                  <div className="flex-1">
                    {editingId === option.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span>{option.name}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    {editingId === option.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleSaveEdit}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(option)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{option.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteOption(option.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
