import { describe, it, expect, afterEach } from 'vitest';
import { getDb } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

describe('users schema', () => {
  const testClerkId = 'test_clerk_id_schema_check';

  afterEach(async () => {
    await getDb().delete(users).where(eq(users.clerkUserId, testClerkId));
  });

  it('inserts and reads back a user with default role buyer', async () => {
    await getDb().insert(users).values({
      clerkUserId: testClerkId,
      email: 'schema-check@example.com',
      fullName: 'Schema Check',
    });

    const [row] = await getDb()
      .select()
      .from(users)
      .where(eq(users.clerkUserId, testClerkId));

    expect(row.role).toBe('buyer');
    expect(row.email).toBe('schema-check@example.com');
  });
});
