import { describe, it, expect } from 'vitest';
import { decideArtworkOutcome } from '../../src/lib/artworks/decision';

describe('decideArtworkOutcome', () => {
  it('approving publishes the artwork', () => {
    expect(decideArtworkOutcome('approve')).toEqual({
      status: 'published',
      rejectionReason: null,
    });
  });

  it('rejecting records the reason', () => {
    expect(decideArtworkOutcome('reject', 'Низкое качество фото')).toEqual({
      status: 'rejected',
      rejectionReason: 'Низкое качество фото',
    });
  });

  it('rejecting without a reason records null', () => {
    expect(decideArtworkOutcome('reject')).toEqual({
      status: 'rejected',
      rejectionReason: null,
    });
  });
});
