# Offline Functionality Setup Guide

Your app now supports full offline functionality! Here's how it works:

## ✨ Features

- **Offline Mode**: App works completely offline after initial authentication
- **Local Storage**: All actions are saved locally when offline
- **Auto Sync**: Automatically syncs to database when internet returns
- **Visual Indicator**: Shows connection status in top-right corner

## 📱 How It Works

### 1. Network Detection
The app automatically detects when you go online/offline using Capacitor's Network plugin.

### 2. Offline Queue
All database operations (daily entries, notes, reflections) are queued locally when offline.

### 3. Auto Sync
When internet connection is restored, the app automatically syncs all pending changes to the database.

## 🔧 Using Offline Storage in Components

### Example: Adding a Daily Entry Offline

```typescript
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { supabase } from '@/integrations/supabase/client';

function MyComponent() {
  const { isOnline } = useNetworkStatus();
  const { addToQueue } = useOfflineStorage();

  const saveDailyEntry = async (entryData) => {
    if (isOnline) {
      // Save directly to database
      const { error } = await supabase
        .from('daily_entries')
        .insert(entryData);
      
      if (error) throw error;
    } else {
      // Save to offline queue
      await addToQueue('daily_entry', entryData);
      toast.success('Saved offline. Will sync when online.');
    }
  };

  return (
    // Your component JSX
  );
}
```

## 📋 Entry Types

When using `addToQueue`, use these type strings:
- `'daily_entry'` - For daily worship entries
- `'daily_note'` - For daily notes
- `'daily_reflection'` - For daily reflections

## 🚀 Next Steps (After GitHub Export)

After exporting to GitHub and running locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add Capacitor platforms**:
   ```bash
   npx cap add ios
   npx cap add android
   ```

3. **Sync and run**:
   ```bash
   npm run build
   npx cap sync
   npx cap run android  # or ios
   ```

## 🔐 Authentication Note

Initial authentication requires internet connection. After login, the app works fully offline.

## 🎯 Testing Offline Mode

### In Browser:
- Open DevTools → Network tab
- Select "Offline" from the throttling dropdown

### On Device:
- Enable Airplane mode
- App will show "Offline Mode" badge
- All actions will queue for sync

## 💾 Storage Location

Offline data is stored using Capacitor Preferences API:
- **iOS**: UserDefaults
- **Android**: SharedPreferences
- **Web**: LocalStorage (fallback)

## 🔄 Sync Behavior

- Syncs automatically when connection is restored
- Shows sync progress in the top-right badge
- Failed syncs are retried on next connection
- Toast notifications confirm successful syncs

## 📊 Monitoring

The `OfflineIndicator` component shows:
- **Green Badge**: Online and synced
- **Yellow Badge**: Syncing in progress
- **Red Badge**: Offline mode (with pending count)
