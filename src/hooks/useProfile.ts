import { useState, useEffect } from 'react';
import { getProfile, updateProfile as updateProfileApi } from '../lib/profiles';
import type { Profile, ProfileUpdate } from '../lib/supabase-types';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getProfile(user.id);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedProfile = await updateProfileApi(user.id, updates);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: loadProfile,
  };
}

