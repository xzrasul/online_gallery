import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { MAX_IMAGE_SIDE, UnreadableImageError, normalizeArtworkImage } from '../../src/lib/uploads/prepare-image';

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#b7264b' } });

describe('normalizeArtworkImage', () => {
  it('shrinks a large photo to 2000px on its long side, as WebP', async () => {
    const out = await normalizeArtworkImage(await solid(4000, 3000).jpeg().toBuffer());
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect([meta.width, meta.height]).toEqual([MAX_IMAGE_SIDE, 1500]);
  });

  it('does not enlarge a small image', async () => {
    const meta = await sharp(await normalizeArtworkImage(await solid(640, 480).png().toBuffer())).metadata();
    expect([meta.width, meta.height]).toEqual([640, 480]);
  });

  it('turns a phone photo upright and drops its metadata, GPS included', async () => {
    // a landscape-stored photo whose EXIF says "rotate 90°", with a GPS position
    const phone = await solid(3000, 2000)
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Make: 'Phone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '38/1 33/1 0/1' } })
      .jpeg()
      .toBuffer();
    const before = await sharp(phone).metadata();
    expect(before.orientation).toBe(6);
    expect(before.exif).toBeDefined();

    const meta = await sharp(await normalizeArtworkImage(phone)).metadata();
    expect([meta.width, meta.height]).toEqual([1333, 2000]);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it('rejects something that is not an image', async () => {
    await expect(normalizeArtworkImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).rejects.toBeInstanceOf(
      UnreadableImageError,
    );
    await expect(normalizeArtworkImage(Buffer.from('hello'))).rejects.toBeInstanceOf(UnreadableImageError);
  });
});
