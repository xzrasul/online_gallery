import { describe, it, expect } from 'vitest';
import { SELLER_CONSENT_FIELD, hasSellerConsent } from '../../src/lib/legal';

describe('hasSellerConsent', () => {
  it('accepts a checked consent box', () => {
    const form = new FormData();
    form.set(SELLER_CONSENT_FIELD, 'on');
    expect(hasSellerConsent(form)).toBe(true);
  });

  it('rejects a missing or forged consent', () => {
    expect(hasSellerConsent(new FormData())).toBe(false);
    const form = new FormData();
    form.set(SELLER_CONSENT_FIELD, 'yes please');
    expect(hasSellerConsent(form)).toBe(false);
  });
});
