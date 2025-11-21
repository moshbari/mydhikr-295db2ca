import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mydhikr.app',
  appName: 'mydhikr',
  webDir: 'dist',
  // Comment out the server section for production builds
  // Uncomment for development with hot-reload from Lovable
  // server: {
  //   url: 'https://09dfef13-55cd-483a-8939-25d0ee1fe442.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
