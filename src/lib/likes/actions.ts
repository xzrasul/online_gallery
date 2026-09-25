'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { setLike } from '@/src/lib/likes/likes';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LikeActionResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; reason: 'sign_in' | 'own' | 'not_found' };

// The heart button: sets the signed-in user's like on an artwork.
export async function setArtworkLike(artworkId: string, liked: boolean): Promise<LikeActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'sign_in' };
  if (typeof artworkId !== 'string' || !UUID.test(artworkId)) return { ok: false, reason: 'not_found' };

  const result = await setLike(getDb(), { userId: user.id, artworkId, liked: liked === true });
  if (result.status !== 'ok') return { ok: false, reason: result.status };
  // pages the browser keeps for a moment (staleTimes in next.config) show the
  // new heart and wishlist count when visited again
  revalidatePath('/', 'layout');
  return { ok: true, liked: result.liked, count: result.count };
}
