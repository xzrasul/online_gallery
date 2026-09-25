import { createClient } from '@supabase/supabase-js';
import { UnreadableImageError, normalizeImage } from './prepare-image';
import { ARTWORK_IMAGES_BUCKET } from './buckets';

export { ARTWORK_IMAGES_BUCKET };

export function getStorageClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Deletes images a bucket served; URLs from anywhere else are ignored.
export async function deleteImages(bucket: string, publicUrls: string[]): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const paths = publicUrls.filter((url) => url.includes(marker)).map((url) => url.split(marker)[1]);
  if (paths.length === 0) return;
  const { error } = await getStorageClient().storage.from(bucket).remove(paths);
  if (error) throw new Error(`Image delete failed: ${error.message}`);
}

export const deleteArtworkImages = (publicUrls: string[]) => deleteImages(ARTWORK_IMAGES_BUCKET, publicUrls);

export type UploadedImage = { url: string; width: number; height: number };
export type UploadResult = (UploadedImage & { error?: undefined }) | { url?: undefined; error: 'image' | 'upload' };

// Normalises the photo (see prepare-image.ts) and stores it in a public bucket
// as <uuid>.webp. Throws UnreadableImageError when the file is not an image.
export async function uploadImage(bucket: string, file: File, maxSide?: number): Promise<UploadedImage> {
  const image = await normalizeImage(await file.arrayBuffer(), maxSide);
  const storage = getStorageClient().storage.from(bucket);
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await storage.upload(path, image.data, { contentType: 'image/webp' });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return { url: storage.getPublicUrl(path).data.publicUrl, width: image.width, height: image.height };
}

// For forms: the image, or why there is none, so the form can say so instead
// of failing: 'image' when the file is not a readable image, 'upload' when the
// server could not process or store it (the cause is logged).
export async function tryUploadImage(bucket: string, file: File, maxSide?: number): Promise<UploadResult> {
  try {
    return await uploadImage(bucket, file, maxSide);
  } catch (error) {
    if (error instanceof UnreadableImageError) return { error: 'image' };
    console.error(`image upload to "${bucket}" failed`, error);
    return { error: 'upload' };
  }
}

export const tryUploadArtworkImage = (file: File) => tryUploadImage(ARTWORK_IMAGES_BUCKET, file);

export async function uploadArtworkImage(file: File): Promise<string> {
  return (await uploadImage(ARTWORK_IMAGES_BUCKET, file)).url;
}
