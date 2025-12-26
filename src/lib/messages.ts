import { supabase } from './supabase';
import type { Message, MessageInsert } from './supabase-types';

export async function getConversationMessages(userId: string, contactId: string, limit = 50) {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_user_id: userId,
    p_contact_id: contactId,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return data as Message[];
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

export async function updateMessage(messageId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({
      content: content.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({
      deleted: true,
    })
    .eq('id', messageId);

  if (error) {
    throw error;
  }
}

export function subscribeToMessages(
  userId: string,
  contactId: string,
  onNewMessage: (message: Message) => void
) {
  const channel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${contactId}`,
      },
      (payload) => {
        const newMessage = payload.new as Message;
        // Only process if the message is for the current user
        if (newMessage.receiver_id === userId) {
          onNewMessage(newMessage);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

