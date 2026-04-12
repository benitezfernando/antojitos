import { login } from '@/app/auth-actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = params?.error === '1';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg-color)',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(255,183,178,0.2) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(141,110,99,0.15) 0px, transparent 50%)`
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ico.jpeg"
            alt="Antojitos"
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }}
          />
          <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>Antojitos Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configuración del sistema</p>
        </div>

        {hasError && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(229, 115, 115, 0.15)',
            color: 'var(--danger)',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            Usuario o contraseña incorrectos
          </div>
        )}

        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Usuario
            </label>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="usuario"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(255,255,255,0.6)',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(255,255,255,0.6)',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem' }}
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
