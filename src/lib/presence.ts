import { supabase } from './supabase';

export async function updatePresence(userId: string, online: boolean) {
  const { error } = await supabase.rpc('update_user_presence', {
    p_user_id: userId,
    p_online: online,
  });

  if (error) {
    console.error('Error updating presence:', error);
  }
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

  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .in('user_id', userIds);

  if (error) {
    console.error('Error fetching presences:', error);
    return [];
  }

  return data;
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
        if (userIds.includes(payload.new?.user_id || payload.old?.user_id)) {
          onPresenceChange(payload.new || payload.old);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

