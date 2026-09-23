import { ARTWORK_IMAGES_BUCKET, getStorageClient } from '../src/lib/uploads/upload-image';

// Creates (or updates) the public bucket for artwork photos. Idempotent.
async function main() {
  const { storage } = getStorageClient();
  const options = {
    public: true,
    fileSizeLimit: '10MB',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
  };

  const { data: existing } = await storage.getBucket(ARTWORK_IMAGES_BUCKET);
  const { error } = existing
    ? await storage.updateBucket(ARTWORK_IMAGES_BUCKET, options)
    : await storage.createBucket(ARTWORK_IMAGES_BUCKET, options);
  if (error) throw error;
  console.log(`Bucket "${ARTWORK_IMAGES_BUCKET}" ${existing ? 'updated' : 'created'} (public, 10MB, images only).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
