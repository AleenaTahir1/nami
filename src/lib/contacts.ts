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
  // First get pending contact requests where this user is the target
  const { data: contactData, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('contact_id', userId)
    .eq('status', 'pending');

  if (contactError) {
    throw contactError;
  }

  if (!contactData || contactData.length === 0) {
    return [];
  }

  // Get the requester user_ids
  const requesterIds = contactData.map(c => c.user_id);

  // Fetch profiles for all requesters
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', requesterIds);

  if (profilesError) {
    throw profilesError;
  }

  // Map profiles to contacts
  const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

  return contactData.map(contact => ({
    ...contact,
    profiles: profilesMap.get(contact.user_id) || null,
  })).filter(c => c.profiles !== null);
}


export async function addContact(_userId: string, contactUserId: string) {
  // Call the secure RPC to create bidirectional relationship
  // Note: _userId is kept for API compatibility but the RPC uses auth.uid() internally
  const { error } = await (supabase.rpc as any)('add_contact', {
    p_contact_id: contactUserId,
  });

  if (error) {
    throw error;
  }
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

export async function declineContactRequest(userId: string, requesterId: string) {
  // Delete the pending request
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', requesterId)
    .eq('contact_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
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

