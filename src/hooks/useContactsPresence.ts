import { useState, useEffect, useMemo } from 'react';
import { getMultiplePresences, subscribeToPresence } from '../lib/presence';
import type { UserPresence } from '../lib/supabase-types';

export function useContactsPresence(contactUserIds: string[]) {
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());

  useEffect(() => {
    if (contactUserIds.length === 0) {
      setPresences(new Map());
      return;
    }

    // Load initial presence data
    const loadPresences = async () => {
      const data = await getMultiplePresences(contactUserIds);
      const presenceMap = new Map<string, UserPresence>();
      data.forEach(presence => {
        presenceMap.set(presence.user_id, presence);
      });
      setPresences(presenceMap);
    };

    loadPresences();

    // Subscribe to presence changes
    const unsubscribe = subscribeToPresence(contactUserIds, (updatedPresence) => {
      setPresences((prev) => {
        const newMap = new Map(prev);
        newMap.set(updatedPresence.user_id, updatedPresence);
        return newMap;
      });
    });

    return unsubscribe;
  }, [contactUserIds.join(',')]); // Depend on stringified array

  // Memoize functions to prevent unnecessary re-renders
  const isOnline = useMemo(() => {
    return (userId: string): boolean => {
      return presences.get(userId)?.online ?? false;
    };
  }, [presences]);

  const getLastSeen = useMemo(() => {
    return (userId: string): Date | null => {
      const presence = presences.get(userId);
      if (!presence?.last_seen) return null;
      return new Date(presence.last_seen);
    };
  }, [presences]);

  return { presences, isOnline, getLastSeen };
}

