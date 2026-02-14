'use client';

import { supabase } from '@/integrations/supabase/client';

export const USER_MEDIA_BUCKET = 'user-media';

function toError(err: unknown, fallback = 'Storage error'): Error {
  if (err instanceof Error) return err;
  const anyErr = err as any;
  const msg = anyErr?.message || anyErr?.error_description || anyErr?.statusCode || fallback;
  return new Error(String(msg));
}

function extFromType(type: string) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'audio/webm') return 'webm';
  if (type === 'audio/mp4') return 'm4a';
  if (type === 'audio/mpeg') return 'mp3';
  return 'bin';
}

export async function uploadUserMedia(params: {
  userId: string;
  file: File | Blob;
  folder: 'avatars' | 'gallery' | 'voice';
}): Promise<string> {
  const { userId, file, folder } = params;

  const type = file.type;
  const ext = extFromType(type);
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${folder}/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: type,
    });

  if (uploadError) throw toError(uploadError, 'Khong the tai anh len');

  const { data } = supabase.storage.from(USER_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Alias for backward compatibility if needed, or I can update usages.
// Since I can search/replace, I'll update usages.
export const uploadUserImage = uploadUserMedia; 

export async function deleteByPublicUrl(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${USER_MEDIA_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const objectPath = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(USER_MEDIA_BUCKET).remove([objectPath]);
  if (error) throw toError(error, 'Khong the xoa file');
}
