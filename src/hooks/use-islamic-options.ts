import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IslamicOption {
  id: string;
  category: 'dhikr' | 'quran' | 'salah';
  name: string;
  sequence_order: number;
  is_active: boolean;
}

export const useIslamicOptions = (category?: 'dhikr' | 'quran' | 'salah') => {
  const [options, setOptions] = useState<IslamicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchOptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('islamic_options')
        .select('*')
        .order('sequence_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOptions((data || []) as IslamicOption[]);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: "Error",
        description: "Failed to load options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [category]);

  const addOption = async (name: string, targetCategory: 'dhikr' | 'quran' | 'salah') => {
    try {
      // Get the highest sequence order for this category
      const { data: maxData } = await supabase
        .from('islamic_options')
        .select('sequence_order')
        .eq('category', targetCategory)
        .order('sequence_order', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxData?.sequence_order || 0) + 1;

      const { error } = await supabase
        .from('islamic_options')
        .insert({
          category: targetCategory,
          name,
          sequence_order: nextOrder,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option added successfully",
      });

      fetchOptions();
    } catch (error) {
      console.error('Error adding option:', error);
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive",
      });
    }
  };

  const updateOption = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('islamic_options')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option updated successfully",
      });

      fetchOptions();
    } catch (error) {
      console.error('Error updating option:', error);
      toast({
        title: "Error",
        description: "Failed to update option",
        variant: "destructive",
      });
    }
  };

  const deleteOption = async (id: string) => {
    try {
      const { error } = await supabase
        .from('islamic_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Option deleted successfully",
      });

      fetchOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive",
      });
    }
  };

  const reorderOptions = async (reorderedOptions: IslamicOption[]) => {
    try {
      // Update sequence_order for all options
      const updates = reorderedOptions.map((option, index) =>
        supabase
          .from('islamic_options')
          .update({ sequence_order: index + 1 })
          .eq('id', option.id)
      );

      await Promise.all(updates);

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      fetchOptions();
    } catch (error) {
      console.error('Error reordering options:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  return {
    options,
    loading,
    fetchOptions,
    addOption,
    updateOption,
    deleteOption,
    reorderOptions,
  };
};
