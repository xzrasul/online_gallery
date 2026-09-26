import { describe, it, expect } from 'vitest';
import { OPERATOR, SELLER_CONSENT_FIELD, hasSellerConsent } from '../../src/lib/legal';

describe('OPERATOR', () => {
  it('holds real details, not bracketed placeholders', () => {
    for (const [key, value] of Object.entries(OPERATOR)) {
      expect(value, key).not.toMatch(/[[\]]/);
      if (key !== 'registration') expect(value.trim(), key).not.toBe('');
    }
  });
});

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
