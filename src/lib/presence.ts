import { supabase } from './supabase';
import type { UserPresence } from './supabase-types';

export async function updatePresence(userId: string, online: boolean, connectionId?: string) {
  const { error } = await supabase.rpc('update_user_presence', {
    p_user_id: userId,
    p_online: online,
    p_connection_id: connectionId,
  });

  if (error) {
    console.error('Error updating presence:', error);
  }
}

export interface PresenceWithPrivacy extends UserPresence {
  show_online_status: boolean;
}

export async function getUserPresence(userId: string) {
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching presence:', error);
    return null;
  }

  return data;
}

export async function getMultiplePresences(userIds: string[]) {
  if (userIds.length === 0) return [];

  // Join with profiles to get show_online_status privacy setting
  const { data, error } = await supabase
    .from('user_presence')
    .select(`
      *,
      profiles!inner(show_online_status)
    `)
    .in('user_id', userIds);

  if (error) {
    console.error('Error fetching presences:', error);
    return [];
  }

  // Map the data and apply privacy filtering
  return data.map((item: any) => {
    const presence = {
      user_id: item.user_id,
      online: item.online,
      last_seen: item.last_seen,
      updated_at: item.updated_at,
      connection_id: item.connection_id,
    };

    // If user has disabled online status, always show as offline
    const showOnlineStatus = item.profiles?.show_online_status ?? true;
    if (!showOnlineStatus) {
      return { ...presence, online: false };
    }

    return presence;
  });
}

export function subscribeToPresence(
  userIds: string[],
  onPresenceChange: (presence: any) => void
) {
  const channel = supabase
    .channel('presence-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_presence',
      },
      async (payload) => {
        const newRecord = payload.new as { user_id?: string } | undefined;
        const oldRecord = payload.old as { user_id?: string } | undefined;
        const userId = newRecord?.user_id || oldRecord?.user_id || '';

        if (userIds.includes(userId)) {
          // Re-fetch with privacy settings to ensure real-time updates respect privacy
          const { data, error } = await supabase
            .from('user_presence')
            .select(`
              *,
              profiles!inner(show_online_status)
            `)
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            const presence = {
              user_id: data.user_id,
              online: data.online,
              last_seen: data.last_seen,
              updated_at: data.updated_at,
              connection_id: data.connection_id,
            };

            // Apply privacy filtering
            const showOnlineStatus = (data as any).profiles?.show_online_status ?? true;
            if (!showOnlineStatus) {
              onPresenceChange({ ...presence, online: false });
            } else {
              onPresenceChange(presence);
            }
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

