import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  ARTWORK_IMAGES_BUCKET,
  getStorageClient,
  tryUploadArtworkImage,
  uploadArtworkImage,
} from '../../src/lib/uploads/upload-image';

describe('uploadArtworkImage', () => {
  it('stores a normalised WebP and returns a public URL that serves it', async () => {
    const png = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#2e7e80' } })
      .png()
      .toBuffer();
    const file = new File([new Uint8Array(png)], 'картина тест.PNG', { type: 'image/png' });

    const url = await uploadArtworkImage(file);

    expect(url).toMatch(new RegExp(`^https://.+/storage/v1/object/public/${ARTWORK_IMAGES_BUCKET}/[0-9a-f-]{36}\\.webp$`));
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['webp', 2000, 667]);

    const path = url.split(`/${ARTWORK_IMAGES_BUCKET}/`)[1];
    await getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET).remove([path]);
  });

  it('refuses a file that is not an image, without uploading anything', async () => {
    const junk = new File([new Uint8Array([137, 80, 78, 71])], 'fake.png', { type: 'image/png' });
    expect(await tryUploadArtworkImage(junk)).toEqual({ error: 'image' });
  });
});
