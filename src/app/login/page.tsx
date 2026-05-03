import { login } from '@/app/auth-actions';
import PasswordInput from './PasswordInput';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const hasError  = params?.error === '1';
  const redirectTo = params?.redirect ?? '/';

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 10%, rgba(255, 107, 74, 0.12) 0px, transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(107, 58, 38, 0.1) 0px, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(255, 107, 74, 0.04) 0px, transparent 70%)`,
    }}>
      <div style={{ width: '100%', maxWidth: '380px', animation: 'fadeIn 0.4s var(--ease) both' }}>

        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ico.jpeg"
            alt="Antojitos"
            style={{
              width: 80, height: 80,
              borderRadius: '20px',
              objectFit: 'cover',
              marginBottom: '1rem',
              boxShadow: '0 8px 28px rgba(255, 107, 74, 0.25)',
            }}
          />
          <h1 style={{
            fontFamily: 'var(--font-geist, Geist), var(--font-outfit, Outfit), system-ui',
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: '0.35rem',
            lineHeight: 1.1,
          }}>
            Antojitos Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ingresá para continuar
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel">

          {hasError && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              Usuario o contraseña incorrectos
            </div>
          )}

          <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="form-group">
              <label htmlFor="login-username" className="label">Usuario</label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="usuario"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="label">Contraseña</label>
              <PasswordInput />
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              style={{ marginTop: '0.25rem', padding: '0.85rem', fontSize: '1rem', width: '100%' }}
            >
              Ingresar
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
