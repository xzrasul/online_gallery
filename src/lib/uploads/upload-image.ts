import { createClient } from '@supabase/supabase-js';

export const ARTWORK_IMAGES_BUCKET = 'artworks';

export function getStorageClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Storage keys must be URL-safe, so only the (sanitised) extension of the
// original file name is kept.
function objectPath(fileName: string): string {
  const ext = fileName.match(/\.([A-Za-z0-9]{1,8})$/)?.[1]?.toLowerCase();
  return ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID();
}

export async function uploadArtworkImage(file: File): Promise<string> {
  const storage = getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET);
  const path = objectPath(file.name);
  const { error } = await storage.upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}
