import { put } from '@vercel/blob';

export async function uploadArtworkImage(file: File): Promise<string> {
  const blob = await put(`artworks/${crypto.randomUUID()}-${file.name}`, file, {
    access: 'public',
  });
  return blob.url;
}
