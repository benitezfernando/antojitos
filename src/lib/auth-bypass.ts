export function isAuthBypassEnabled(): boolean {
  const user = (process.env.ADMIN_USERNAME ?? '').trim().replace(/^["']|["']$/g, '').trim();
  return user === 'ferbenitez';
}
