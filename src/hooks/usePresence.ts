import { useEffect, useRef } from 'react';
import { updatePresence } from '../lib/presence';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds (server expires at 2 minutes)

export function usePresence() {
  const { user } = useAuth();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);
  const connectionIdRef = useRef<string>('');

  useEffect(() => {
    if (!user) return;

    // Generate unique connection ID for this session
    connectionIdRef.current = crypto.randomUUID();

    // Set online when component mounts
    const setOnline = async () => {
      await updatePresence(user.id, true, connectionIdRef.current);
      isOnlineRef.current = true;
    };

    const setOffline = async () => {
      await updatePresence(user.id, false, connectionIdRef.current);
      isOnlineRef.current = false;
    };

    // Set initial online status
    setOnline();

    // Set up heartbeat to keep presence updated
    heartbeatRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(user.id, true, connectionIdRef.current);
      }
    }, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    // Handle window focus
    const handleFocus = () => {
      setOnline();
    };

    const handleBlur = () => {
      // Don't immediately set offline on blur, wait for heartbeat to timeout
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status on page close
      // Note: This is a fallback, the actual offline status
      // will be set by the heartbeat timeout on the server side
      updatePresence(user.id, false, connectionIdRef.current);
    };

    // Handle online/offline events
    const handleOnline = () => {
      setOnline();
    };

    const handleOffline = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // Cleanup
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      setOffline();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  return null; // This hook doesn't return anything, just manages presence
}

