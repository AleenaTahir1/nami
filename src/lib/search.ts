import { supabase } from './supabase';
import type { Profile, Message } from './supabase-types';

export async function searchContacts(userId: string, query: string): Promise<Profile[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('user_id', userId) // Exclude self
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error) {
    throw error;
  }

  return data as Profile[];
}

export async function searchMessages(
  userId: string,
  contactId: string,
  query: string
): Promise<Message[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .or(`sender_id.eq.${contactId},receiver_id.eq.${contactId}`)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data as Message[];
}

export async function searchAllMessages(userId: string, query: string): Promise<Message[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return data as Message[];
}

