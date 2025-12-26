import { useState, useEffect } from 'react';
import {
  getUserContacts,
  addContact as addContactApi,
  removeContact as removeContactApi,
  getContactRequests,
  acceptContactRequest as acceptContactRequestApi,
  declineContactRequest as declineContactRequestApi,
} from '../lib/contacts';
import { searchProfiles } from '../lib/profiles';
import type { Profile, ContactRequestWithProfile } from '../lib/supabase-types';
import { useAuth } from '../contexts/AuthContext';

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<ContactRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadRequests();
    } else {
      setContacts([]);
      setRequests([]);
      setLoading(false);
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserContacts(user.id);
      setContacts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;

    try {
      setRequestsLoading(true);
      const data = await getContactRequests(user.id);
      setRequests(data as unknown as ContactRequestWithProfile[]);
    } catch (err) {
      console.error('Error loading contact requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const addContact = async (contactUserId: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    // Check if already a contact
    const alreadyContact = contacts.some(c => c.user_id === contactUserId);
    if (alreadyContact) {
      throw new Error('This user is already your contact');
    }

    try {
      await addContactApi(user.id, contactUserId);
      await loadContacts();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeContact = async (contactUserId: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      await removeContactApi(user.id, contactUserId);
      await loadContacts();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const acceptRequest = async (requesterId: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      await acceptContactRequestApi(user.id, requesterId);
      await Promise.all([loadContacts(), loadRequests()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept request';
      throw new Error(errorMessage);
    }
  };

  const declineRequest = async (requesterId: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      await declineContactRequestApi(user.id, requesterId);
      await loadRequests();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline request';
      throw new Error(errorMessage);
    }
  };

  const searchUsers = async (searchTerm: string) => {
    try {
      const results = await searchProfiles(searchTerm);
      // Filter out current user and existing contacts
      const filtered = results.filter(
        (profile) =>
          profile.user_id !== user?.id &&
          !contacts.some((c) => c.user_id === profile.user_id)
      );
      return filtered;
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  };

  return {
    contacts,
    requests,
    loading,
    requestsLoading,
    error,
    addContact,
    removeContact,
    acceptRequest,
    declineRequest,
    searchUsers,
    refetch: loadContacts,
    refetchRequests: loadRequests,
  };
}
