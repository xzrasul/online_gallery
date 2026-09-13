import { describe, it, expect } from 'vitest';
import { parseClerkUserCreated } from '../../src/lib/webhooks/parse-clerk-user';

describe('parseClerkUserCreated', () => {
  it('extracts id, primary email, and full name from a Clerk user.created payload', () => {
    const payload = {
      type: 'user.created',
      data: {
        id: 'user_abc123',
        first_name: 'Иван',
        last_name: 'Петров',
        email_addresses: [
          { id: 'idn_1', email_address: 'other@example.com' },
          { id: 'idn_2', email_address: 'ivan@example.com' },
        ],
        primary_email_address_id: 'idn_2',
      },
    };

    expect(parseClerkUserCreated(payload)).toEqual({
      clerkUserId: 'user_abc123',
      email: 'ivan@example.com',
      fullName: 'Иван Петров',
    });
  });
});
