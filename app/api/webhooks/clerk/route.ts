import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { parseClerkUserCreated } from '@/src/lib/webhooks/parse-clerk-user';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const payload = await req.text();
  const headerList = await headers();
  const svixHeaders = {
    'svix-id': headerList.get('svix-id') ?? '',
    'svix-timestamp': headerList.get('svix-timestamp') ?? '',
    'svix-signature': headerList.get('svix-signature') ?? '',
  };

  let event: unknown;
  try {
    new Webhook(secret).verify(payload, svixHeaders);
    event = JSON.parse(payload);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const typed = event as { type: string };
  if (typed.type !== 'user.created') {
    return new Response('ignored', { status: 200 });
  }

  const { clerkUserId, email, fullName } = parseClerkUserCreated(event);
  await getDb().insert(users).values({ clerkUserId, email, fullName });

  return new Response('ok', { status: 200 });
}
