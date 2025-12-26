import { supabase } from './supabase';
import type { Contact, Profile, ContactStatus } from './supabase-types';

export async function getUserContacts(userId: string) {
  const { data, error } = await supabase.rpc('get_user_contacts', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data as Profile[];
}

export async function getContactRequests(userId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*, profiles!contacts_contact_id_fkey(*)')
    .eq('contact_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return data;
}

export async function addContact(userId: string, contactUserId: string) {
  // Check if contact already exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('contact_id', contactUserId)
    .maybeSingle();

  if (existing) {
    throw new Error('Contact already exists');
  }

  // Create bidirectional accepted relationship immediately
  // Insert first direction (with upsert to handle conflicts)
  const { error: error1 } = await supabase
    .from('contacts')
    .upsert({
      user_id: userId,
      contact_id: contactUserId,
      status: 'accepted',
    }, {
      onConflict: 'user_id,contact_id',
      ignoreDuplicates: false
    });

  if (error1) {
    throw error1;
  }

  // Insert reverse direction
  const { data, error: error2 } = await supabase
    .from('contacts')
    .upsert({
      user_id: contactUserId,
      contact_id: userId,
      status: 'accepted',
    }, {
      onConflict: 'user_id,contact_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error2) {
    throw error2;
  }

  return data as Contact;
}

export async function updateContactStatus(
  contactId: string,
  status: ContactStatus
) {
  const { data, error } = await supabase
    .from('contacts')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Contact;
}

export async function acceptContactRequest(userId: string, requesterId: string) {
  // Update the pending request to accepted
  const { error: updateError } = await supabase
    .from('contacts')
    .update({ 
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', requesterId)
    .eq('contact_id', userId)
    .eq('status', 'pending');

  if (updateError) {
    throw updateError;
  }

  // Create the reverse relationship
  const { data, error: insertError } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      contact_id: requesterId,
      status: 'accepted',
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return data;
}

export async function removeContact(userId: string, contactUserId: string) {
  // Remove both directions of the relationship
  const { error: error1 } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', userId)
    .eq('contact_id', contactUserId);

  if (error1) {
    throw error1;
  }

  const { error: error2 } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', contactUserId)
    .eq('contact_id', userId);

  if (error2) {
    throw error2;
  }
}

export async function blockContact(userId: string, contactUserId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .update({ 
      status: 'blocked',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('contact_id', contactUserId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Contact;
}

