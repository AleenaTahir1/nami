import { useState, useEffect, useRef, useCallback } from 'react';
import { updateTypingStatus, subscribeToTypingStatus } from '../lib/typing';
import { useAuth } from '../contexts/AuthContext';

export function useTypingIndicator(contactId: string | null) {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [contactTyping, setContactTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to contact's typing status
  useEffect(() => {
    if (!user || !contactId) {
      setContactTyping(false);
      return;
    }

    const unsubscribe = subscribeToTypingStatus(user.id, contactId, (typing) => {
      setContactTyping(typing);
    });

    return unsubscribe;
  }, [user, contactId]);

  // Function to indicate user is typing
  const setTyping = useCallback((typing: boolean) => {
    if (!user || !contactId) return;

    setIsTyping(typing);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      // Update typing status
      updateTypingStatus(user.id, contactId, true);

      // Auto-clear after 3 seconds of no activity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(user.id, contactId, false);
        setIsTyping(false);
      }, 3000);
    } else {
      // Immediately clear typing status
      updateTypingStatus(user.id, contactId, false);
    }
  }, [user, contactId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user && contactId) {
        updateTypingStatus(user.id, contactId, false);
      }
    };
  }, [user, contactId]);

  return {
    isTyping,
    contactTyping,
    setTyping,
  };
}
