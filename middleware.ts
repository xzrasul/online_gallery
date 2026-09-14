import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isSellerRoute = createRouteMatcher(['/dashboard/seller(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAuthenticatedRoute = createRouteMatcher(['/dashboard(.*)', '/become-seller(.*)', '/choose-role(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAuthenticatedRoute(req) || isSellerRoute(req) || isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;

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
