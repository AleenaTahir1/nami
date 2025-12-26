import { useState, useEffect } from 'react';
import { getUserContacts, addContact as addContactApi, removeContact as removeContactApi } from '../lib/contacts';
import { searchProfiles } from '../lib/profiles';
import type { Profile } from '../lib/supabase-types';
import { useAuth } from '../contexts/AuthContext';

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadContacts();
    } else {
      setContacts([]);
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
      await loadContacts(); // Reload contacts
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
      await loadContacts(); // Reload contacts
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove contact';
      setError(errorMessage);
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
    loading,
    error,
    addContact,
    removeContact,
    searchUsers,
    refetch: loadContacts,
  };
}

