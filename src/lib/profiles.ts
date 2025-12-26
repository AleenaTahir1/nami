import { supabase } from './supabase';
import type { Profile, ProfileUpdate } from './supabase-types';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function searchProfiles(searchTerm: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .limit(20);

  if (error) {
    throw error;
  }

  return data as Profile[];
}

