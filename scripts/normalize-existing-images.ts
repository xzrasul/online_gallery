// Brings artwork photos uploaded before normalisation in line with new uploads
// (upright, ≤2000px, WebP, no metadata — phone photos may carry GPS).
//
//   npx dotenv -e .env.local -- npx tsx scripts/normalize-existing-images.ts           # report only
//   npx dotenv -e .env.local -- npx tsx scripts/normalize-existing-images.ts --apply   # rewrite
//
// With --apply each old image is re-encoded, stored as a new <uuid>.webp, the
// artwork row is pointed at it, and only then is the old file deleted.
import { eq, not, like } from 'drizzle-orm';
import sharp from 'sharp';
import { getDb } from '../src/db';
import { artworks } from '../src/db/schema';
import { ARTWORK_IMAGES_BUCKET, deleteArtworkImages, getStorageClient } from '../src/lib/uploads/upload-image';
import { normalizeArtworkImage } from '../src/lib/uploads/prepare-image';

async function main() {
  const apply = process.argv.includes('--apply');
  const db = getDb();
  const rows = await db
    .select({ id: artworks.id, title: artworks.title, imageUrl: artworks.imageUrl })
    .from(artworks)
    .where(not(like(artworks.imageUrl, '%.webp')));
  console.log(`${rows.length} artwork image(s) not yet normalised${apply ? '' : ' (report only; pass --apply to rewrite)'}`);

  for (const row of rows) {
    if (!row.imageUrl.includes(`/storage/v1/object/public/${ARTWORK_IMAGES_BUCKET}/`)) {
      console.log(`- ${row.title}: not in our bucket, skipped (${row.imageUrl})`);
      continue;
    }
    const res = await fetch(row.imageUrl);
    if (!res.ok) {
      console.log(`- ${row.title}: download failed (${res.status}), skipped`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(original).metadata().catch(() => null);
    const gps = meta?.exif ? meta.exif.includes(Buffer.from('GPS')) : false;
    console.log(
      `- ${row.title}: ${meta ? `${meta.format} ${meta.width}×${meta.height}` : 'unreadable'}, ${Math.round(original.length / 1024)} KB` +
        `${meta?.exif ? ', has EXIF' : ''}${gps ? ' (GPS!)' : ''}`,
    );
    if (!apply || !meta) continue;

    const image = await normalizeArtworkImage(original);
    const path = `${crypto.randomUUID()}.webp`;
    const storage = getStorageClient().storage.from(ARTWORK_IMAGES_BUCKET);
    const { error } = await storage.upload(path, image, { contentType: 'image/webp' });
    if (error) throw new Error(`upload failed for ${row.id}: ${error.message}`);
    const url = storage.getPublicUrl(path).data.publicUrl;
    await db.update(artworks).set({ imageUrl: url }).where(eq(artworks.id, row.id));
    await deleteArtworkImages([row.imageUrl]);
    console.log(`  → rewritten as ${path} (${Math.round(image.length / 1024)} KB)`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
