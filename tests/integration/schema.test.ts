import { describe, it, expect, afterEach } from 'vitest';
import { getDb } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { testTelegramId } from '../helpers/test-telegram-id';

describe('users schema', () => {
  const testUserKey = 'test_schema_check';

  afterEach(async () => {
    await getDb().delete(users).where(eq(users.telegramId, testTelegramId(testUserKey)));
  });

  it('inserts and reads back a user with default role buyer', async () => {
    await getDb().insert(users).values({
      telegramId: testTelegramId(testUserKey),
      fullName: 'Schema Check',
    });

    const [row] = await getDb()
      .select()
      .from(users)
      .where(eq(users.telegramId, testTelegramId(testUserKey)));

    expect(row.role).toBe('buyer');
    expect(row.fullName).toBe('Schema Check');
    expect(row.username).toBeNull();
  });
});
