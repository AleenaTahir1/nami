import { supabase } from './supabase';
import type { Message, Attachment } from './supabase-types';
import { uploadAttachment } from './attachments';

export type MessageWithAttachments = Message & {
  attachments?: Attachment[];
};

export async function getConversationMessages(
  userId: string,
  contactId: string,
  limit = 50,
  before: string | null = null
): Promise<MessageWithAttachments[]> {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_user_id: userId,
    p_contact_id: contactId,
    p_limit: limit,
    p_before: before,
  });

  if (error) {
    throw error;
  }

  const messages = data as Message[];

  // Fetch attachments for all messages
  if (messages.length > 0) {
    const messageIds = messages.map(m => m.id);
    const { data: attachments, error: attachError } = await supabase
      .from('attachments')
      .select('*')
      .in('message_id', messageIds);

    if (!attachError && attachments) {
      // Group attachments by message_id
      const attachmentsByMessage = attachments.reduce((acc, att) => {
        if (!acc[att.message_id]) acc[att.message_id] = [];
        acc[att.message_id].push(att as Attachment);
        return acc;
      }, {} as Record<string, Attachment[]>);

      // Add attachments to messages
      return messages.map(msg => ({
        ...msg,
        attachments: attachmentsByMessage[msg.id] || [],
      }));
    }
  }

  return messages.map(msg => ({ ...msg, attachments: [] }));
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  files?: File[]
): Promise<MessageWithAttachments> {
  // Use default text if content is empty and there are files
  const messageContent = content.trim() || (files && files.length > 0 ? '📎 Attachment' : '');

  // Create the message first
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: messageContent,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const message = data as Message;

  // If there are files, upload them
  if (files && files.length > 0) {
    const attachments: Attachment[] = [];
    for (const file of files) {
      try {
        const attachment = await uploadAttachment(senderId, message.id, file);
        attachments.push(attachment);
      } catch (err) {
        console.error(`Failed to upload file ${file.name}:`, err);
        // Continue with other files even if one fails
      }
    }
    return { ...message, attachments };
  }

  return { ...message, attachments: [] };
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
      content: 'This message was deleted'
    })
    .eq('id', messageId);

  if (error) {
    throw error;
  }
}

export async function deleteAllMessages(userId: string, contactId: string) {
  // Use a slightly more robust query structure for bulk deletion
  const { error } = await supabase
    .from('messages')
    .update({ deleted: true })
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .or(`sender_id.eq.${contactId},receiver_id.eq.${contactId}`);

  if (error) {
    throw error;
  }
}

export async function hideMessage(messageId: string) {
  // @ts-ignore - RPC types not yet generated
  const { error } = await supabase.rpc('hide_message', {
    p_message_id: messageId,
  });

  if (error) {
    throw error;
  }
}

export function subscribeToMessages(
  userId: string,
  contactId: string,
  onNewMessage: (message: MessageWithAttachments) => void
) {
  const handleNewMessage = async (message: Message) => {
    // Fetch attachments for the new message
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', message.id);

    onNewMessage({
      ...message,
      attachments: (attachments as Attachment[]) || [],
    });
  };

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
          handleNewMessage(newMessage);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAllIncomingMessages(
  userId: string,
  onNewMessage: (message: MessageWithAttachments) => void
) {
  const handleNewMessage = async (message: Message) => {
    // Fetch attachments/sender info if needed, but for notification just body is enough
    // We might want to fetch sender name though.
    // For now, let's just return the message and let the UI fetch details or use a simpler object.
    // Actually, to show sender name, we need it.

    // Fetch attachments
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', message.id);

    onNewMessage({
      ...message,
      attachments: (attachments as Attachment[]) || [],
    });
  };

  const channel = supabase
    .channel('global-messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        const newMessage = payload.new as Message;
        handleNewMessage(newMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
