import { useEffect, useRef } from 'react';
import { updatePresence } from '../lib/presence';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function usePresence() {
  const { user } = useAuth();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Set online when component mounts
    const setOnline = async () => {
      await updatePresence(user.id, true);
      isOnlineRef.current = true;
    };

    const setOffline = async () => {
      await updatePresence(user.id, false);
      isOnlineRef.current = false;
    };

    // Set initial online status
    setOnline();

    // Set up heartbeat to keep presence updated
    heartbeatRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(user.id, true);
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
      if (navigator.sendBeacon) {
        // Note: This is a fallback, the actual offline status
        // will be set by the heartbeat timeout on the server side
        updatePresence(user.id, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

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
    };
  }, [user]);

  return null; // This hook doesn't return anything, just manages presence
}

