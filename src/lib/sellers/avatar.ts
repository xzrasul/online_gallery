import { getDb } from '../../db';
import { AVATARS_BUCKET } from '../uploads/buckets';
import { deleteImages, tryUploadImage } from '../uploads/upload-image';
import { setSellerAvatar } from './applications';

// Artist photos are stored square-ish and small: 600px on the long side.
export const AVATAR_SIDE = 600;

export type AvatarResult = 'saved' | 'removed' | 'image' | 'upload' | 'not_artist';

// Uploads the new photo (or, with `remove`, drops the current one) and deletes
// the old file. Callers check who may do this.
export async function changeSellerAvatar(userId: string, formData: FormData): Promise<AvatarResult> {
  const file = formData.get('avatar');
  const remove = formData.get('remove') === '1';
  let url: string | null = null;
  if (!remove) {
    if (!(file instanceof File) || file.size === 0) return 'image';
    const up = await tryUploadImage(AVATARS_BUCKET, file, AVATAR_SIDE);
    if (up.error !== undefined) return up.error;
    url = up.url;
  }
  const result = await setSellerAvatar(getDb(), userId, url);
  const stale = result ? result.previous : url;
  if (stale) await deleteImages(AVATARS_BUCKET, [stale]).catch((e) => console.error('avatar delete failed', e));
  if (!result) return 'not_artist';
  return remove ? 'removed' : 'saved';
}

export const AVATAR_MESSAGES: Record<AvatarResult, string> = {
  saved: 'Фото сохранено.',
  removed: 'Фото убрано.',
  image: 'Не удалось прочитать фото. Выберите JPEG, PNG или WebP.',
  upload: 'Не удалось сохранить фото. Попробуйте ещё раз чуть позже.',
  not_artist: 'Фото можно добавить только одобренному художнику.',
};
