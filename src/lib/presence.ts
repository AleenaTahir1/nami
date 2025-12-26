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
      (payload) => {
        const newRecord = payload.new as { user_id?: string } | undefined;
        const oldRecord = payload.old as { user_id?: string } | undefined;
        if (userIds.includes(newRecord?.user_id || oldRecord?.user_id || '')) {
          onPresenceChange(payload.new || payload.old);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

