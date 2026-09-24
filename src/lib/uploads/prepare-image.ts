import sharp from 'sharp';

// Every artwork photo is stored the same way: turned upright (EXIF orientation),
// at most 2000px on its long side, as WebP, with all metadata removed — phone
// photos carry GPS coordinates, which must not end up public.
export const MAX_IMAGE_SIDE = 2000;
const WEBP_QUALITY = 86;

export class UnreadableImageError extends Error {
  constructor() {
    super('The file is not an image we can read');
    this.name = 'UnreadableImageError';
  }
}

export async function normalizeArtworkImage(input: ArrayBuffer | Buffer): Promise<Buffer> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  try {
    return await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw new UnreadableImageError();
  }
}
