// Browser side: shrink a photo before it is uploaded, so a 5–10 MB phone photo
// goes up as ~0.5–1.5 MB and fits the server's request limit. The server still
// normalises every image (prepare-image.ts); this only saves time and data.

export const MAX_PHOTO_SIDE = 2000;
// what the form may send: under the 4 MB server-action limit, with room for the other fields
export const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;

export type ShrunkPhoto = { file: File; width: number; height: number };

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

// Returns a smaller WebP (or JPEG where WebP can't be encoded) copy, or the
// original file when it can't be decoded here (the server then decides).
export async function shrinkPhoto(file: File): Promise<ShrunkPhoto | null> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await toBlob(canvas, 'image/webp', 0.86);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!blob) return null;
  // keep the original if it was already smaller
  if (scale === 1 && blob.size >= file.size) return { file, width, height };
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${file.name.replace(/\.[^.]*$/, '') || 'photo'}.${ext}`;
  return { file: new File([blob], name, { type: blob.type }), width, height };
}
