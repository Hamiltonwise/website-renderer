import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/otp/request',
  '/api/auth/otp/verify',
];

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Check authentication for non-public routes
  if (!isPublicRoute(pathname) && !pathname.startsWith('/api/')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token || !verifyToken(token)) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check if this is a site subdomain request
  // Pattern: {hostname}.sites.localhost:7777 or {hostname}.sites.getalloro.com
  const siteMatch = host.match(/^([^.]+)\.sites\./);

  if (siteMatch) {
    const hostname = siteMatch[1];
    console.log(`[Middleware] Site request: ${hostname}${pathname}`);

    // Rewrite to site rendering route
    const rewriteUrl = new URL(`/site/${hostname}${pathname === '/' ? '' : pathname}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately by route handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
