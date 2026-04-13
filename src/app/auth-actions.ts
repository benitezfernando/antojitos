'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const VALID_USER = (process.env.ADMIN_USERNAME ?? '').replace(/^["']|["']$/g, '').trim();
const VALID_PASS = (process.env.ADMIN_PASSWORD ?? '').replace(/^["']|["']$/g, '').trim();
const SESSION_COOKIE = 'antojitos_session_v2';

if (!VALID_USER || !VALID_PASS) {
  console.warn('[Auth] ADMIN_USERNAME o ADMIN_PASSWORD no están definidas en las variables de entorno.');
}

export async function login(formData: FormData): Promise<void> {
  const user = (formData.get('username') as string ?? '').trim();
  const pass = (formData.get('password') as string ?? '').trim();
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!user || !pass) {
    redirect('/login?error=1');
  }

  if (user === VALID_USER && pass === VALID_PASS) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Sin maxAge ni expires → cookie de sesión: se borra al cerrar el navegador
    });
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/';
    redirect(safeRedirect);
  } else {
    redirect('/login?error=1');
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/login');
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === 'authenticated';
}
