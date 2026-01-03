'use client';

import { supabase } from '@/integrations/supabase/client';

export const USER_MEDIA_BUCKET = 'user-media';

function extFromType(type: string) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadUserImage(params: {
  userId: string;
  file: File;
  folder: 'avatars' | 'gallery';
}): Promise<string> {
  const { userId, file, folder } = params;

  const ext = extFromType(file.type);
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${folder}/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(USER_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteByPublicUrl(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${USER_MEDIA_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const objectPath = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(USER_MEDIA_BUCKET).remove([objectPath]);
  if (error) throw error;
}