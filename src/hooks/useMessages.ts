import { useState, useEffect, useRef } from 'react';
import {
  getConversationMessages,
  sendMessage as sendMessageApi,
  updateMessage as updateMessageApi,
  deleteMessage as deleteMessageApi,
  deleteAllMessages,
  hideMessage,
  subscribeToMessages,
  type MessageWithAttachments,
} from '../lib/messages';
import {
  markConversationAsRead,
  markMessageAsDelivered,
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
  const hasScrolledOnceRef = useRef(false);

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

        // Mark as delivered immediately since we received it
        if (newMessage.receiver_id === user.id) {
          markMessageAsDelivered(newMessage.id, user.id);
        }

        // Auto-mark as read if conversation is open
        markConversationAsRead(user.id, contactId).catch(console.error);
      });

      return unsubscribe;
    } else {
      setMessages([]);
      setMessageStatuses(new Map());
      setHasMore(false);
      lastMessageIdRef.current = null;
      hasScrolledOnceRef.current = false;
    }
  }, [user, contactId]);

  // Subscribe to status updates for all messages
  useEffect(() => {
    if (messages.length === 0) return;

    const messageIds = messages.map(m => m.id);

    console.log('Subscribing to message status for', messageIds.length, 'messages');

    const unsubscribe = subscribeToMessageStatus(messageIds, (updatedStatus) => {
      console.log('Received status update:', updatedStatus);
      setMessageStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(updatedStatus.message_id, updatedStatus);
        return newMap;
      });
    });

    return unsubscribe;
  }, [messages.length, messages[messages.length - 1]?.id]); // Depend on count and last message ID

  // Auto-scroll when messages load (Initial Load)
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          scrollToBottom(false); // Instant scroll on initial load
          // Mark that we've scrolled once to enable pagination
          setTimeout(() => {
            hasScrolledOnceRef.current = true;
          }, 100);
        }, 1000); // Increased to 1 second
        return () => clearTimeout(timer);
      });
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

        // Mark loaded messages sent TO me as delivered
        // We do this optimistically for the last batch to ensure status updates
        data.forEach((m) => {
          if (m.receiver_id === user.id) {
            markMessageAsDelivered(m.id, user.id);
          }
        });
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
    // Don't load more until we've scrolled to bottom at least once
    if (!hasScrolledOnceRef.current || !user || !contactId || loadingMore || !hasMore || messages.length === 0) return;

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

    // Create optimistic message for instant feedback
    const optimisticMessage: MessageWithAttachments = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: contactId,
      content: content.trim() || '📎 Attachment',
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted: false,
      reply_to_id: null,
      attachments: [],
    };

    try {
      setSending(true);
      setError(null);
      
      // Add optimistic message immediately for better UX
      setMessages((prev) => [...prev, optimisticMessage]);
      
      // Send the actual message
      const newMessage = await sendMessageApi(user.id, contactId, content, files);
      
      // Replace optimistic message with real one
      setMessages((prev) => 
        prev.map(msg => msg.id === optimisticMessage.id ? newMessage : msg)
      );

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
      }, 500);

      // Immediate scroll for sent messages
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      console.error('Error sending message:', err);
      
      // Show user-friendly error
      alert(`Failed to send message: ${errorMsg}\n\nPlease check your connection and try again.`);
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

  // Delete message for current user only (local state + DB persistence)
  const deleteMessageForMe = async (messageId: string) => {
    try {
      // 1. Optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // 2. Persist to DB
      await hideMessage(messageId);
    } catch (err) {
      console.error('Error hiding message:', err);
      // Revert if failed (optional, but good UX to just log for now)
    }
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

  // Clear entire chat history
  const clearChat = async () => {
    if (!user || !contactId) return;
    try {
      await deleteAllMessages(user.id, contactId);
      // Locally mark all as deleted or just clear?
      // Mark as deleted to maintain the "deleted message" bars if desired, 
      // but usually "Clear Chat" clears the screen.
      setMessages([]);
    } catch (err) {
      console.error('Error clearing chat:', err);
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
    clearChat,
    editMessage,
    messagesEndRef,
    getMessageStatus,
    refetch: loadMessages,
    loadMore,
    hasMore,
    loadingMore
  };
}

