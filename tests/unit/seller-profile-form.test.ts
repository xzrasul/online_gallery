import { describe, it, expect } from 'vitest';
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH, parseSellerProfileForm } from '../../src/lib/sellers/profile-form';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe('parseSellerProfileForm', () => {
  it('trims the fields and drops an empty Telegram contact', () => {
    expect(parseSellerProfileForm(form({ displayName: '  Студия  ', bio: ' Пишу маслом. ', telegramContact: '   ' }))).toEqual({
      displayName: 'Студия',
      bio: 'Пишу маслом.',
      telegramContact: undefined,
    });
  });

  it('keeps a Telegram contact', () => {
    expect(parseSellerProfileForm(form({ displayName: 'Студия', bio: 'Био', telegramContact: ' @artist ' }))?.telegramContact).toBe(
      '@artist',
    );
  });

  it('rejects a missing name or bio', () => {
    expect(parseSellerProfileForm(form({ displayName: ' ', bio: 'Био' }))).toBeNull();
    expect(parseSellerProfileForm(form({ displayName: 'Студия' }))).toBeNull();
  });

  it('rejects fields over the length limits', () => {
    expect(parseSellerProfileForm(form({ displayName: 'я'.repeat(MAX_DISPLAY_NAME_LENGTH + 1), bio: 'Био' }))).toBeNull();
    expect(parseSellerProfileForm(form({ displayName: 'Студия', bio: 'я'.repeat(MAX_BIO_LENGTH + 1) }))).toBeNull();
  });
});
