import { useState, useEffect, useRef } from 'react';
import {
  getConversationMessages,
  sendMessage as sendMessageApi,
  subscribeToMessages,
  type MessageWithAttachments,
} from '../lib/messages';
import { 
  markConversationAsRead, 
  getMessagesStatus, 
  subscribeToMessageStatus 
} from '../lib/messageStatus';
import type { MessageStatus } from '../lib/supabase-types';
import { useAuth } from '../contexts/AuthContext';

export function useMessages(contactId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithAttachments[]>([]);
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
        // Auto-mark as read if conversation is open
        markConversationAsRead(user.id, contactId).catch(console.error);
      });

      return unsubscribe;
    } else {
      setMessages([]);
      setMessageStatuses(new Map());
    }
  }, [user, contactId]);

  // Subscribe to status updates for all messages
  useEffect(() => {
    if (messages.length === 0) return;

    const messageIds = messages.map(m => m.id);
    const unsubscribe = subscribeToMessageStatus(messageIds, (updatedStatus) => {
      setMessageStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(updatedStatus.message_id, updatedStatus);
        return newMap;
      });
    });

    return unsubscribe;
  }, [messages.map(m => m.id).join(',')]); // Only re-subscribe when message IDs change

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom(!loading);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length]); // Only trigger when message count changes

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, files?: File[]) => {
    if (!user || !contactId || (!content.trim() && (!files || files.length === 0))) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      const newMessage = await sendMessageApi(user.id, contactId, content, files);
      setMessages((prev) => [...prev, newMessage]);
      
      // Immediately try to load status for the new message
      setTimeout(async () => {
        try {
          const statuses = await getMessagesStatus([newMessage.id]);
          if (statuses.length > 0) {
            setMessageStatuses((prev) => {
              const newMap = new Map(prev);
              newMap.set(statuses[0].message_id, statuses[0]);
              return newMap;
            });
          }
        } catch (err) {
          console.error('Error loading status for new message:', err);
        }
      }, 500); // Wait a bit for the trigger to create the status entry
      
      // Immediate scroll for sent messages
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto', 
        block: 'end',
        inline: 'nearest'
      });
    }
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

