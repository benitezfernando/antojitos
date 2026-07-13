import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthBypassEnabled } from './lib/auth-bypass';

const SESSION_COOKIE = 'antojitos_session_v2';
const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sin auth activa no tiene sentido mostrar el form: redirige /login a home en vez de dejarlo pasar como ruta pública.
  if (isAuthBypassEnabled()) {
    if (pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|ico.jpeg).*)'],
};
