import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Max requests per window
  loginMaxAttempts: 5, // Max login attempts per window
};

function getRateLimitKey(request: NextRequest): string {
  const ip = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  return ip;
}

function checkRateLimit(key: string, isLogin: boolean = false): boolean {
  const now = Date.now();
  const limit = isLogin ? RATE_LIMIT.loginMaxAttempts : RATE_LIMIT.maxRequests;
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Protected admin routes
const protectedRoutes = ['/admin'];
const publicRoutes = ['/login', '/api/v1/auth/admin-login', '/api/auth/admin-login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (only for HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Rate limiting for login endpoints
  if (pathname.includes('/admin-login')) {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key, true)) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }
  
  // Rate limiting for all other routes
  if (!isPublicRoute) {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key, false)) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }
  
  // Protect admin routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for authentication token in cookies or headers
    const token = request.cookies.get('adminToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Optionally validate token here (you can add JWT verification)
    // For now, we'll let the API routes handle validation
  }
  
  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

