import { describe, it, expect } from 'vitest';
import { shouldDeleteClerkUser } from '../e2e/helpers/clerk-cleanup';

describe('shouldDeleteClerkUser', () => {
  const recorded = 'buyer+clerk_test_1700000000000@example.com';

  it('deletes a pure test user whose email matches the recorded one', () => {
    expect(shouldDeleteClerkUser([recorded], recorded)).toBe(true);
  });

  it('matches emails case-insensitively', () => {
    expect(shouldDeleteClerkUser(['Buyer+Clerk_Test_1700000000000@Example.com'], recorded)).toBe(true);
    expect(shouldDeleteClerkUser([recorded], recorded.toUpperCase())).toBe(true);
  });

  it('keeps a user when one of the emails is not a test address', () => {
    expect(shouldDeleteClerkUser([recorded, 'someone@gmail.com'], recorded)).toBe(false);
  });

  it('keeps a test user whose email is not the recorded one', () => {
    expect(shouldDeleteClerkUser(['other+clerk_test_1@example.com'], recorded)).toBe(false);
  });

  it('keeps a user without any email', () => {
    expect(shouldDeleteClerkUser([], recorded)).toBe(false);
  });

  it('never matches an owner-like address', () => {
    expect(shouldDeleteClerkUser(['someone@gmail.com'], 'someone@gmail.com')).toBe(false);
  });
});
