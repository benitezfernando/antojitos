import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'antojitos_session_v2';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_API_PATHS = ['/api/init-db', '/api/seed-db', '/api/test-db'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(jpeg|jpg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    const session = request.cookies.get(SESSION_COOKIE);
    if (session?.value === 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (session?.value !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
