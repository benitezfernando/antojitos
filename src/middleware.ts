import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { proxy } from './proxy';

export function middleware(request: NextRequest) {
  const response = proxy(request);

  // Forzar no-cache en todas las respuestas de navegación HTML
  // Esto mata cualquier cache del SW o del browser antes de que actúe
  if (request.headers.get('accept')?.includes('text/html') || request.mode === 'navigate') {
    const res = response ?? NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  return response;
}

export { config } from './proxy';
