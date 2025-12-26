import { useState, useEffect, useRef } from 'react';
import {
  getConversationMessages,
  sendMessage as sendMessageApi,
  updateMessage as updateMessageApi,
  deleteMessage as deleteMessageApi,
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
  const lastMessageIdRef = useRef<string | null>(null);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
      setHasMore(false);
      lastMessageIdRef.current = null;
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

  // Auto-scroll when messages load (Initial Load)
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Longer delay to ensure DOM is fully updated after loading
      const timer = setTimeout(() => {
        scrollToBottom(false); // Instant scroll on initial load
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contactId, loading]); // Remove loadingMore from dependency

  // Also scroll when new messages arrive (New Message / Sent Message)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage.id;

      // If we have a last message recorded, and the new last message is different
      // it means we received or sent a new message (appended to bottom).
      // If we just loaded more history (prepended), the last message ID stays the same.
      if (lastMessageIdRef.current && lastMessageId !== lastMessageIdRef.current) {
        scrollToBottom(true);
      }

      lastMessageIdRef.current = lastMessageId;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user || !contactId) return;

    try {
      setLoading(true);
      setError(null);
      setHasMore(true);
      const limit = 20;
      const data = await getConversationMessages(user.id, contactId, limit);

      setMessages(data);
      if (data.length < limit) {
        setHasMore(false);
      }

      // Update last message ref immediately after load
      if (data.length > 0) {
        lastMessageIdRef.current = data[data.length - 1].id;
      }

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

  const loadMore = async () => {
    if (!user || !contactId || loadingMore || !hasMore || messages.length === 0) return;

    try {
      setLoadingMore(true);
      const oldestMessage = messages[0];
      const limit = 10;
      const data = await getConversationMessages(user.id, contactId, limit, oldestMessage.created_at);

      if (data.length > 0) {
        setMessages((prev) => [...data, ...prev]);

        // Fetch statuses for new/old messages
        const messageIds = data.map(m => m.id);
        const statuses = await getMessagesStatus(messageIds);
        setMessageStatuses((prev) => {
          const newMap = new Map(prev);
          statuses.forEach(status => newMap.set(status.message_id, status));
          return newMap;
        });
      }

      if (data.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
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

  // Delete message for current user only (local state)
  const deleteMessageForMe = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // Delete message for everyone (marks as deleted in DB)
  const deleteMessageForEveryone = async (messageId: string) => {
    try {
      await deleteMessageApi(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deleted: true, content: 'This message was deleted' }
            : m
        )
      );
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  // Edit message (with 15-min time limit)
  const editMessage = async (messageId: string, newContent: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.created_at) {
      throw new Error('Message not found');
    }

    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    if (now - messageTime > fifteenMinutes) {
      throw new Error('Cannot edit messages older than 15 minutes');
    }

    try {
      const updated = await updateMessageApi(messageId, newContent);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: updated.content, edited_at: updated.edited_at }
            : m
        )
      );
    } catch (err) {
      console.error('Error editing message:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    editMessage,
    messagesEndRef,
    getMessageStatus,
    refetch: loadMessages,
    loadMore,
    hasMore,
    loadingMore
  };
}

