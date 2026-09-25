'use client';

// Every heart click fires WISH_EVENT, so the header badge and the wishlist
// page follow along without a reload.

export const WISH_EVENT = 'sanat:wish';
export type WishDetail = { id: string; liked: boolean };

export function emitWish(detail: WishDetail) {
  window.dispatchEvent(new CustomEvent<WishDetail>(WISH_EVENT, { detail }));
}
