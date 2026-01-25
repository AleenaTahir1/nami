import { supabase } from './supabase';
import type { Attachment } from './supabase-types';

export async function uploadAttachment(
  userId: string,
  messageId: string,
  file: File
): Promise<Attachment> {
  // Generate a unique file path: userId/messageId/timestamp-filename
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${messageId}/${timestamp}-${sanitizedFileName}`;

  // Upload file to Supabase Storage with retry logic
  let uploadRetries = 3;
  let uploadError: Error | null = null;

  while (uploadRetries > 0) {
    const { error } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!error) {
      uploadError = null;
      break;
    }

    uploadError = error;
    uploadRetries--;
    
    if (uploadRetries > 0) {
      // Wait before retrying (exponential backoff: 1s, 2s, 3s)
      await new Promise(resolve => setTimeout(resolve, (4 - uploadRetries) * 1000));
    }
  }

  if (uploadError) {
    throw new Error(`Failed to upload file after 3 retries: ${uploadError.message}`);
  }

  // Create attachment record in database with retry logic
  let dbRetries = 3;
  let dbError: Error | null = null;
  let data: Attachment | null = null;

  while (dbRetries > 0 && !data) {
    const { data: result, error } = await supabase
      .from('attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (!error && result) {
      data = result as Attachment;
      break;
    }

    dbError = error;
    dbRetries--;
    
    if (dbRetries > 0) {
      await new Promise(resolve => setTimeout(resolve, (4 - dbRetries) * 1000));
    }
  }

  if (!data) {
    // If database insert fails, try to clean up the uploaded file
    await supabase.storage.from('attachments').remove([storagePath]);
    throw new Error(`Failed to create attachment record after 3 retries: ${dbError?.message}`);
  }

  return data;
}

export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, 3600); // URL valid for 1 hour

  if (!data?.signedUrl) {
    throw new Error('Failed to generate attachment URL');
  }

  return data.signedUrl;
}

export async function getMessageAttachments(messageId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Attachment[];
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  // First, get the attachment to find the storage path
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.storage_path]);

  if (storageError) {
    console.error('Failed to delete file from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);

  if (dbError) {
    throw dbError;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
  return '📎';
}

