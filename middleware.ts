import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';

const isSellerRoute = createRouteMatcher(['/dashboard/seller(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAuthenticatedRoute = createRouteMatcher(['/dashboard(.*)', '/become-seller(.*)', '/choose-role(.*)']);

// NOTE: this deliberately reads `role` from our own `users` table (the
// authorization source of truth everywhere else in this project — Tasks 8
// and 12 both read role from the DB, never from Clerk metadata) instead of
// `sessionClaims.publicMetadata.role`. The original plan's session-claims
// fast path depends on a custom session token claim configured in Clerk's
// dashboard; that dashboard editor is currently broken (Monaco
// initialization error + a React hydration error on every reload,
// confirmed by both the controller and the human directly in the browser,
// not an automation artifact), so publicMetadata never reaches the session
// token. Falling back to a DB read here costs one extra round-trip per
// protected route via the same HTTP-based Neon driver already used
// everywhere else in this project — acceptable for Phase 1.
export default clerkMiddleware(async (auth, req) => {
  if (isAuthenticatedRoute(req) || isSellerRoute(req) || isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
    const role = user?.role;

    if (isSellerRoute(req) && role !== 'seller') {
      return NextResponse.redirect(new URL('/become-seller/status', req.url));
    }
    if (isAdminRoute(req) && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    '/(api|trpc)(.*)',
  ],
};
