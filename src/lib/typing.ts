import { supabase } from './supabase';

export async function updateTypingStatus(userId: string, contactId: string, typing: boolean) {
  const { error } = await supabase
    .from('typing_indicators')
    .upsert({
      user_id: userId,
      contact_id: contactId,
      typing,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,contact_id'
    });

  if (error) {
    console.error('Error updating typing status:', error);
  }
}

export function subscribeToTypingStatus(
  userId: string,
  contactId: string,
  onTypingChange: (typing: boolean) => void
) {
  const channel = supabase
    .channel(`typing-${userId}-${contactId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `user_id=eq.${contactId}`,
      },
      (payload) => {
        const newRecord = payload.new as { typing?: boolean; user_id?: string; contact_id?: string } | undefined;
        
        // Only react if this is for the current conversation
        if (newRecord && newRecord.user_id === contactId && newRecord.contact_id === userId) {
          onTypingChange(newRecord.typing ?? false);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
