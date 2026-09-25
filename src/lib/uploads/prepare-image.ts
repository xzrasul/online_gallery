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

// sharp is a native module, loaded only when a photo is processed: if it
// can't load on the server, the pages that hold the upload form still open,
// and the upload fails with a message instead of the whole page failing.
// Also returns the stored size in pixels. `maxSide` is the long side's limit.
export async function normalizeImage(
  input: ArrayBuffer | Buffer,
  maxSide = MAX_IMAGE_SIDE,
): Promise<{ data: Buffer; width: number; height: number }> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const { default: sharp } = await import('sharp');
  try {
    const { data, info } = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new UnreadableImageError();
  }
}

export async function normalizeArtworkImage(input: ArrayBuffer | Buffer): Promise<Buffer> {
  return (await normalizeImage(input)).data;
}
