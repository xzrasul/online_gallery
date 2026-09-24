import { describe, it, expect } from 'vitest';
import { afterSignInPath, safeNextPath } from '../../src/lib/auth/next-path';

describe('safeNextPath', () => {
  it('accepts same-site paths', () => {
    expect(safeNextPath('/gallery/artwork/abc')).toBe('/gallery/artwork/abc');
    expect(safeNextPath('/gallery?categoryId=1')).toBe('/gallery?categoryId=1');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'gallery', '', '/a\nb', null, 42])(
    'rejects %j',
    (raw) => {
      expect(safeNextPath(raw)).toBeNull();
    },
  );
});

describe('afterSignInPath', () => {
  it('keeps the old destinations without next', () => {
    expect(afterSignInPath(true)).toBe('/choose-role');
    expect(afterSignInPath(false)).toBe('/cabinet');
  });

  it('returns a signed-in user to next, and carries it through the role choice', () => {
    expect(afterSignInPath(false, '/gallery/artwork/abc')).toBe('/gallery/artwork/abc');
    expect(afterSignInPath(true, '/gallery/artwork/abc')).toBe('/choose-role?next=%2Fgallery%2Fartwork%2Fabc');
  });
});
