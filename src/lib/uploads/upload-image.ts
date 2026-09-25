import { createClient } from '@supabase/supabase-js';
import { UnreadableImageError, normalizeArtworkImage } from './prepare-image';

export const ARTWORK_IMAGES_BUCKET = 'artworks';

export function getStorageClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


// Deletes images this bucket served; URLs from anywhere else are ignored.
export async function deleteArtworkImages(publicUrls: string[]): Promise<void> {
  const marker = `/storage/v1/object/public/${ARTWORK_IMAGES_BUCKET}/`;
  const paths = publicUrls.filter((url) => url.includes(marker)).map((url) => url.split(marker)[1]);
  if (paths.length === 0) return;
  const { error } = await getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET).remove(paths);
  if (error) throw new Error(`Image delete failed: ${error.message}`);
}

// For forms: the public URL, or why there is none, so the form can say so
// instead of failing: 'image' when the file is not a readable image, 'upload'
// when the server could not process or store it (the cause is logged).
export async function tryUploadArtworkImage(
  file: File,
): Promise<{ url: string; error?: undefined } | { url?: undefined; error: 'image' | 'upload' }> {
  try {
    return { url: await uploadArtworkImage(file) };
  } catch (error) {
    if (error instanceof UnreadableImageError) return { error: 'image' };
    console.error('artwork image upload failed', error);
    return { error: 'upload' };
  }
}

// Normalises the photo (see prepare-image.ts) and stores it as <uuid>.webp.
// Throws UnreadableImageError when the file is not a readable image.
export async function uploadArtworkImage(file: File): Promise<string> {
  const image = await normalizeArtworkImage(await file.arrayBuffer());
  const storage = getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET);
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await storage.upload(path, image, { contentType: 'image/webp' });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}
