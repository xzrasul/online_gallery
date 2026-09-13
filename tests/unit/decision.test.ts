import { describe, it, expect } from 'vitest';
import { decideApplicationOutcome } from '../../src/lib/sellers/decision';

describe('decideApplicationOutcome', () => {
  it('approving grants the seller role', () => {
    expect(decideApplicationOutcome('approve')).toEqual({
      role: 'seller',
      applicationStatus: 'approved',
      rejectionReason: null,
    });
  });

  it('rejecting keeps the buyer role and records the reason', () => {
    expect(decideApplicationOutcome('reject', 'Недостаточно примеров работ')).toEqual({
      role: 'buyer',
      applicationStatus: 'rejected',
      rejectionReason: 'Недостаточно примеров работ',
    });
  });

  it('rejecting without a reason records null', () => {
    expect(decideApplicationOutcome('reject')).toEqual({
      role: 'buyer',
      applicationStatus: 'rejected',
      rejectionReason: null,
    });
  });
});
