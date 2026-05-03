export const dynamic = 'force-dynamic';

const tenant = process.env.NEXT_PUBLIC_TENANT ?? 'antojitos';
const apiUrl  = process.env.NEXT_PUBLIC_API_URL  ?? '—';

export default function AcercaDePage() {
  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Acerca de</h1>
          <p className="page-subtitle">Información del sistema</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

        {/* App */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Aplicación</span>
            <span className="badge badge-ok">v1.0.0</span>
          </div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: 'Nombre',     value: 'AntojitosAdmin'   },
              { label: 'Framework',  value: 'Next.js 16 + React 19' },
              { label: 'Hosting',    value: 'Vercel'           },
              { label: 'Tenant',     value: tenant             },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <dt style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{label}</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Backend */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Backend API</span>
            <span className="badge badge-accent">Railway</span>
          </div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: 'Stack',     value: 'Go 1.22 + Gin'    },
              { label: 'Base de datos', value: 'Google Sheets' },
              { label: 'URL',       value: apiUrl.replace('https://', ''), mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                <dt style={{ color: 'var(--text-subtle)', fontWeight: 600, flexShrink: 0 }}>{label}</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined, fontSize: mono ? '0.78rem' : undefined }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Seguridad */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Seguridad</span>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', listStyle: 'none', fontSize: '0.88rem' }}>
            {[
              'Cookie httpOnly + sameSite lax',
              'Contraseña con bcrypt cost 12',
              'Middleware de auth en todas las rutas',
              'Variables sensibles solo server-side',
            ].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--mint)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-muted)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Deuda técnica */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="section-header">
          <span className="section-title">Deuda técnica conocida</span>
          <span className="badge badge-warning">3 items</span>
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', listStyle: 'none', fontSize: '0.88rem' }}>
          {[
            'margen_ganancia en el contrato de API sin estandarizar (entero vs decimal)',
            'Sin rate limiting en el endpoint de login',
            'Sin autenticación en los endpoints del backend (API pública)',
          ].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>!</span>
              <span style={{ color: 'var(--text-muted)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
