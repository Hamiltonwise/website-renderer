import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

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
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
