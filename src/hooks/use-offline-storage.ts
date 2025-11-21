import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface OfflineEntry {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

const OFFLINE_QUEUE_KEY = 'offline_queue';

export const useOfflineStorage = () => {
  const [queue, setQueue] = useState<OfflineEntry[]>([]);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const { value } = await Preferences.get({ key: OFFLINE_QUEUE_KEY });
      if (value) {
        setQueue(JSON.parse(value));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const addToQueue = async (type: string, data: any) => {
    const entry: OfflineEntry = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    const newQueue = [...queue, entry];
    setQueue(newQueue);
    
    try {
      await Preferences.set({
        key: OFFLINE_QUEUE_KEY,
        value: JSON.stringify(newQueue),
      });
    } catch (error) {
      console.error('Error saving to offline queue:', error);
    }

    return entry.id;
  };

  const markAsSynced = async (id: string) => {
    const newQueue = queue.filter(item => item.id !== id);
    setQueue(newQueue);
    
    try {
      await Preferences.set({
        key: OFFLINE_QUEUE_KEY,
        value: JSON.stringify(newQueue),
      });
    } catch (error) {
      console.error('Error updating offline queue:', error);
    }
  };

  const clearQueue = async () => {
    setQueue([]);
    try {
      await Preferences.remove({ key: OFFLINE_QUEUE_KEY });
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  };

  const getUnsyncedEntries = () => {
    return queue.filter(item => !item.synced);
  };

  return {
    queue,
    addToQueue,
    markAsSynced,
    clearQueue,
    getUnsyncedEntries,
  };
};
