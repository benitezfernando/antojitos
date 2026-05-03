'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

const VALID_USER = (process.env.ADMIN_USERNAME ?? '').replace(/^["']|["']$/g, '').trim();
const PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH ?? '').trim();
const SESSION_COOKIE = 'antojitos_session_v2';

if (!VALID_USER || !PASSWORD_HASH) {
  console.warn('[Auth] ADMIN_USERNAME o ADMIN_PASSWORD_HASH no están definidas en las variables de entorno.');
}

export async function login(formData: FormData): Promise<void> {
  const user = (formData.get('username') as string ?? '').trim();
  const pass = (formData.get('password') as string ?? '').trim();
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!user || !pass) {
    redirect('/login?error=1');
  }

  const validUser = user === VALID_USER;
  const validPass = PASSWORD_HASH ? await bcrypt.compare(pass, PASSWORD_HASH) : false;

  if (validUser && validPass) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
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
