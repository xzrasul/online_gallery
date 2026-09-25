'use client';

import { useSyncExternalStore } from 'react';

// Showcase («макет») works can't be liked in the database, so a signed-in
// visitor's hearts on them are kept in this browser. Every heart click (real or
// showcase) also fires WISH_EVENT so the header badge and the wishlist page
// follow along without a reload.

const KEY = 'sanat:wishlist';
export const WISH_EVENT = 'sanat:wish';
export type WishDetail = { id: string; liked: boolean };

let cacheRaw: string | null = null;
let cacheIds: string[] = [];
const EMPTY: string[] = [];

function readRaw() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function snapshot() {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cacheIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      cacheIds = [];
    }
  }
  return cacheIds;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener(WISH_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(WISH_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Showcase work ids this browser has hearted (empty on the server and during hydration). */
export function useLocalWishlist() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function emitWish(detail: WishDetail) {
  window.dispatchEvent(new CustomEvent<WishDetail>(WISH_EVENT, { detail }));
}

export function setLocalWish(id: string, liked: boolean) {
  const ids = snapshot().filter((x) => x !== id);
  if (liked) ids.unshift(id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // storage blocked: there is nowhere to remember a showcase heart
  }
  emitWish({ id, liked });
}
