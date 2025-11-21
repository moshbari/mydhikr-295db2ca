import { supabase } from '@/integrations/supabase/client';
import { OfflineEntry } from '@/hooks/use-offline-storage';

export class OfflineSync {
  static async syncEntry(entry: OfflineEntry): Promise<boolean> {
    try {
      switch (entry.type) {
        case 'daily_entry':
          return await this.syncDailyEntry(entry.data);
        case 'daily_note':
          return await this.syncDailyNote(entry.data);
        case 'daily_reflection':
          return await this.syncDailyReflection(entry.data);
        default:
          console.warn('Unknown entry type:', entry.type);
          return false;
      }
    } catch (error) {
      console.error('Error syncing entry:', error);
      return false;
    }
  }

  private static async syncDailyEntry(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('daily_entries')
      .upsert(data, { onConflict: 'id' });
    
    return !error;
  }

  private static async syncDailyNote(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('daily_notes')
      .upsert(data, { onConflict: 'id' });
    
    return !error;
  }

  private static async syncDailyReflection(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('daily_reflections')
      .upsert(data, { onConflict: 'id' });
    
    return !error;
  }

  static async syncAll(entries: OfflineEntry[]): Promise<{ 
    success: string[], 
    failed: string[] 
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const entry of entries) {
      const synced = await this.syncEntry(entry);
      if (synced) {
        success.push(entry.id);
      } else {
        failed.push(entry.id);
      }
    }

    return { success, failed };
  }
}
