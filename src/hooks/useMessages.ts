import { useState, useEffect, useRef } from 'react';
import {
  getConversationMessages,
  sendMessage as sendMessageApi,
  subscribeToMessages,
} from '../lib/messages';
import { 
  markConversationAsRead, 
  getMessagesStatus, 
  subscribeToMessageStatus 
} from '../lib/messageStatus';
import type { Message, MessageStatus, MessageWithStatus } from '../lib/supabase-types';
import { useAuth } from '../contexts/AuthContext';

export function useMessages(contactId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithStatus[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Map<string, MessageStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && contactId) {
      loadMessages();
      
      // Mark conversation as read when opened
      markConversationAsRead(user.id, contactId).catch(console.error);
      
      // Subscribe to new messages
      const unsubscribe = subscribeToMessages(user.id, contactId, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        // Auto-mark as read if conversation is open
        markConversationAsRead(user.id, contactId).catch(console.error);
      });

      return unsubscribe;
    } else {
      setMessages([]);
      setMessageStatuses(new Map());
    }
  }, [user, contactId]);

  const loadMessages = async () => {
    if (!user || !contactId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getConversationMessages(user.id, contactId);
      setMessages(data);
      
      // Load message statuses
      const messageIds = data.map(m => m.id);
      if (messageIds.length > 0) {
        const statuses = await getMessagesStatus(messageIds);
        const statusMap = new Map<string, MessageStatus>();
        statuses.forEach(status => {
          statusMap.set(status.message_id, status);
        });
        setMessageStatuses(statusMap);

        // Subscribe to status updates
        const unsubscribeStatus = subscribeToMessageStatus(messageIds, (updatedStatus) => {
          setMessageStatuses((prev) => {
            const newMap = new Map(prev);
            newMap.set(updatedStatus.message_id, updatedStatus);
            return newMap;
          });
        });

        // Return cleanup function stored in a variable that persists
        return unsubscribeStatus;
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !contactId || !content.trim()) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      const newMessage = await sendMessageApi(user.id, contactId, content);
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageStatus = (messageId: string): MessageStatus | null => {
    return messageStatuses.get(messageId) || null;
  };

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    messagesEndRef,
    getMessageStatus,
    refetch: loadMessages,
  };
}

