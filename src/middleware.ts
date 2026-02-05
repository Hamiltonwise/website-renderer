import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// Auth API base URL (signalsai-backend) - for future cross-app sync
const AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:3000';

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

// Validate token with signalsai-backend (with fallback to local validation)
// Currently using local-only validation; central validation ready when needed
async function validateToken(token: string): Promise<boolean> {
  try {
    // First try local validation (faster, works offline)
    const localValid = verifyToken(token);
    if (!localValid) return false;

    // Optionally validate with central auth server
    // Uncomment below to enable central validation (adds latency but ensures consistency)
    /*
    const response = await fetch(`${AUTH_API_URL}/api/auth/otp/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return false;
    
    const data = await response.json();
    return data.valid === true;
    */

    return true;
  } catch (error) {
    // Fallback to local validation if central server unreachable
    return verifyToken(token) !== null;
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Check authentication for non-public routes
  if (!isPublicRoute(pathname) && !pathname.startsWith('/api/')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token (currently local-only, central validation ready when needed)
    const isValid = await validateToken(token);
    if (!isValid) {
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
     * - Public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
