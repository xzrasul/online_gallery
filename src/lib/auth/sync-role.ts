import { clerkClient } from '@clerk/nextjs/server';

export async function syncRoleToClerk(
  clerkUserId: string,
  role: 'buyer' | 'seller' | 'admin',
) {
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { role },
  });
}
