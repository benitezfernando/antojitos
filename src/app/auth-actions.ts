'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const VALID_USER = 'ferbenitez';
const VALID_PASS = 'ferbenitez';
const SESSION_COOKIE = 'antojitos_session';

export async function login(formData: FormData) {
  const user = formData.get('username') as string;
  const pass = formData.get('password') as string;

  if (user === VALID_USER && pass === VALID_PASS) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    redirect('/configuracion');
  } else {
    redirect('/login?error=1');
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/login');
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === 'authenticated';
}
