import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useEffect } from 'react';
import { OfflineSync } from '@/lib/offline-sync';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator = () => {
  const { isOnline } = useNetworkStatus();
  const { queue, markAsSynced, getUnsyncedEntries } = useOfflineStorage();
  const unsyncedCount = getUnsyncedEntries().length;

  useEffect(() => {
    if (isOnline && unsyncedCount > 0) {
      syncOfflineData();
    }
  }, [isOnline, unsyncedCount]);

  const syncOfflineData = async () => {
    const unsynced = getUnsyncedEntries();
    if (unsynced.length === 0) return;

    toast.info('Syncing offline data...', {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />
    });

    const { success, failed } = await OfflineSync.syncAll(unsynced);

    // Mark successful syncs
    for (const id of success) {
      await markAsSynced(id);
    }

    if (success.length > 0) {
      toast.success(`Synced ${success.length} items successfully`);
    }

    if (failed.length > 0) {
      toast.error(`Failed to sync ${failed.length} items`);
    }
  };

  if (!isOnline) {
    return (
      <Badge variant="secondary" className="fixed top-4 right-4 z-50 gap-2">
        <CloudOff className="h-4 w-4" />
        Offline Mode
        {unsyncedCount > 0 && ` (${unsyncedCount} pending)`}
      </Badge>
    );
  }

  if (unsyncedCount > 0) {
    return (
      <Badge variant="secondary" className="fixed top-4 right-4 z-50 gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Syncing... ({unsyncedCount})
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="fixed top-4 right-4 z-50 gap-2">
      <Cloud className="h-4 w-4" />
      Online
    </Badge>
  );
};
