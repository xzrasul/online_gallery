import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateUserMetadata = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: () =>
    Promise.resolve({
      users: { updateUserMetadata },
    }),
}));

import { syncRoleToClerk } from '../../src/lib/auth/sync-role';

describe('syncRoleToClerk', () => {
  beforeEach(() => updateUserMetadata.mockClear());

  it('writes the role into Clerk publicMetadata', async () => {
    await syncRoleToClerk('user_abc123', 'seller');

    expect(updateUserMetadata).toHaveBeenCalledWith('user_abc123', {
      publicMetadata: { role: 'seller' },
    });
  });
});
