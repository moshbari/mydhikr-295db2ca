import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setNetworkType(status.connectionType);
      } catch (error) {
        // Fallback to browser API if Capacitor Network is not available
        setIsOnline(navigator.onLine);
        setNetworkType('unknown');
      }
    };

    checkStatus();

    // Listen for network status changes
    let listener: any;
    
    const setupListener = async () => {
      try {
        listener = await Network.addListener('networkStatusChange', (status) => {
          setIsOnline(status.connected);
          setNetworkType(status.connectionType);
        });
      } catch (error) {
        // Fallback to browser events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  return { isOnline, networkType };
};
