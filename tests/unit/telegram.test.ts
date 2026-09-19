import { describe, it, expect } from 'vitest';
import { telegramHref } from '../../src/lib/telegram';

describe('telegramHref', () => {
  it('turns a handle with @ into a t.me link', () => {
    expect(telegramHref('@rustam_art')).toBe('https://t.me/rustam_art');
  });
  it('accepts a bare handle and trims spaces', () => {
    expect(telegramHref('  rustam_art ')).toBe('https://t.me/rustam_art');
  });
  it('normalizes t.me and https://t.me links', () => {
    expect(telegramHref('t.me/rustam_art/')).toBe('https://t.me/rustam_art');
    expect(telegramHref('https://t.me/rustam_art')).toBe('https://t.me/rustam_art');
  });
  it('returns null for empty, missing or non-handle values', () => {
    expect(telegramHref(null)).toBeNull();
    expect(telegramHref(undefined)).toBeNull();
    expect(telegramHref('')).toBeNull();
    expect(telegramHref('+992 900 00 00 00')).toBeNull();
    expect(telegramHref('ab')).toBeNull();
    expect(telegramHref('two words here')).toBeNull();
  });
});
