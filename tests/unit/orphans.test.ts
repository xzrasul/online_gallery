import { describe, it, expect } from 'vitest';
import { findOrphans, imageUrlsOf, storagePathOf } from '../../src/lib/uploads/orphans';

const BASE = 'https://abc.supabase.co/storage/v1/object/public';
const HOUR = 60 * 60 * 1000;
const now = new Date('2026-09-26T12:00:00Z');
const old = new Date(now.getTime() - 2 * HOUR);

describe('storagePathOf', () => {
  it('returns the path inside the bucket', () => {
    expect(storagePathOf('artworks', `${BASE}/artworks/a.webp`)).toBe('a.webp');
    expect(storagePathOf('artworks', `${BASE}/artworks/a.webp?v=1`)).toBe('a.webp');
  });

  it('ignores other buckets, other sites and empty values', () => {
    expect(storagePathOf('artworks', `${BASE}/avatars/a.webp`)).toBeNull();
    expect(storagePathOf('artworks', 'https://t.me/i/userpic/a.jpg')).toBeNull();
    expect(storagePathOf('artworks', null)).toBeNull();
  });
});

describe('findOrphans', () => {
  const files = [
    { name: 'used.webp', size: 10, createdAt: old },
    { name: 'orphan.webp', size: 20, createdAt: old },
    { name: 'fresh.webp', size: 30, createdAt: new Date(now.getTime() - 60 * 1000) },
    { name: 'no-date.webp', size: 40, createdAt: null },
  ];

  it('returns old files no URL points at', () => {
    const orphans = findOrphans('artworks', files, [`${BASE}/artworks/used.webp`, null], now, HOUR);
    expect(orphans.map((f) => f.name)).toEqual(['orphan.webp']);
  });

  it('does not count a same-named file in another bucket as a reference', () => {
    const orphans = findOrphans('artworks', files, [`${BASE}/avatars/used.webp`], now, HOUR);
    expect(orphans.map((f) => f.name)).toEqual(['used.webp', 'orphan.webp']);
  });
});

describe('imageUrlsOf', () => {
  it('collects the image columns of deleted rows', () => {
    expect(
      imageUrlsOf('banners', [
        { imageUrl: 'a', imageMobileUrl: null },
        { imageUrl: 'b', imageMobileUrl: 'c' },
      ]),
    ).toEqual(['a', 'b', 'c']);
    expect(imageUrlsOf('seller_applications', [{ avatarUrl: 'd' }])).toEqual(['d']);
  });

  it('returns nothing for tables without images', () => {
    expect(imageUrlsOf('categories', [{ name: 'x' }])).toEqual([]);
  });
});
