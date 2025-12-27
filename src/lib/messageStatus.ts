import { supabase } from './supabase';
import type { MessageStatus } from './supabase-types';

export async function markMessageAsRead(messageId: string, userId: string) {
  const { data, error } = await supabase
    .from('message_status')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as MessageStatus;
}

export async function markConversationAsRead(userId: string, contactId: string) {
  // First, get all message IDs from the contact to this user
  const { data: messages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .eq('sender_id', contactId)
    .eq('receiver_id', userId);

  if (fetchError) {
    console.error('Error fetching messages for read receipt:', fetchError);
    return;
  }

  if (!messages || messages.length === 0) {
    return; // No messages to mark as read
  }

  const messageIds = messages.map(m => m.id);

  // Mark all unread messages from the contact as read
  const { error } = await supabase
    .from('message_status')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .is('read_at', null)
    .in('message_id', messageIds);

  if (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
}

export async function getMessageStatus(messageId: string) {
  const { data, error } = await supabase
    .from('message_status')
    .select('*')
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as MessageStatus | null;
}

export async function getMessagesStatus(messageIds: string[]) {
  if (messageIds.length === 0) return [];

  const { data, error } = await supabase
    .from('message_status')
    .select('*')
    .in('message_id', messageIds);

  if (error) {
    throw error;
  }

  return data as MessageStatus[];
}

export function subscribeToMessageStatus(
  messageIds: string[],
  onStatusUpdate: (status: MessageStatus) => void
) {
  // Use a more stable channel name based on the first message ID
  // This prevents duplicate subscriptions while still being unique per conversation
  const channelName = messageIds.length > 0
    ? `message-status-${messageIds[0]}`
    : `message-status-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT and UPDATE
        schema: 'public',
        table: 'message_status',
      },
      (payload) => {
        const updatedStatus = payload.new as MessageStatus;
        // Check if this status update is for any of our messages
        if (messageIds.includes(updatedStatus.message_id)) {
          console.log('Received status update for message:', updatedStatus.message_id);
          onStatusUpdate(updatedStatus);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

