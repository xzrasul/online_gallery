import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { SESSION_COOKIE, getSessionSecret, readSessionToken } from '@/src/lib/auth/session-token';

const isSellerRoute = (path: string) => path.startsWith('/dashboard/seller');
const isAdminRoute = (path: string) => path.startsWith('/admin');
const isAuthenticatedRoute = (path: string) =>
  ['/dashboard', '/become-seller', '/choose-role'].some((prefix) => path.startsWith(prefix));

// Role is read from our own `users` table, the authorization source of truth
// everywhere else in this project; the session cookie only carries the user id.
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!isAuthenticatedRoute(path) && !isSellerRoute(path) && !isAdminRoute(path)) {
    return NextResponse.next();
  }

  const userId = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value, getSessionSecret());
  const [user] = userId ? await getDb().select().from(users).where(eq(users.id, userId)) : [];
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (isSellerRoute(path) && user.role !== 'seller') {
    return NextResponse.redirect(new URL('/become-seller/status', req.url));
  }
  if (isAdminRoute(path) && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/become-seller/:path*', '/choose-role/:path*', '/admin/:path*'],
};
