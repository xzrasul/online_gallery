import { describe, it, expect } from 'vitest';
import { del } from '@vercel/blob';
import { uploadArtworkImage } from '../../src/lib/uploads/upload-image';

describe('uploadArtworkImage', () => {
  it('uploads a file and returns a public https URL', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]); // arbitrary bytes, content isn't validated
    const file = new File([bytes], 'test.png', { type: 'image/png' });

    const url = await uploadArtworkImage(file);

    expect(url).toMatch(/^https:\/\//);

    await del(url);
  });
});
