import { describe, it, expect } from 'vitest';
import { ARTWORK_IMAGES_BUCKET, getStorageClient, uploadArtworkImage } from '../../src/lib/uploads/upload-image';

describe('uploadArtworkImage', () => {
  it('uploads a file and returns a public URL that serves it', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]); // arbitrary bytes, content isn't validated
    const file = new File([bytes], 'картина тест.PNG', { type: 'image/png' });

    const url = await uploadArtworkImage(file);

    expect(url).toMatch(new RegExp(`^https://.+/storage/v1/object/public/${ARTWORK_IMAGES_BUCKET}/[0-9a-f-]{36}\\.png$`));
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);

    const path = url.split(`/${ARTWORK_IMAGES_BUCKET}/`)[1];
    await getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET).remove([path]);
  });
});
