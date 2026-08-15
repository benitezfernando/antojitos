import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Aplicación</CardTitle>
            <Badge variant="outline" className="border-success text-success">v1.0.0</Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Backend */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Backend API</CardTitle>
            <Badge variant="outline">Railway</Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

      </div>

      {/* Deuda técnica */}
      <Card style={{ marginTop: '1.25rem' }}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Deuda técnica conocida</CardTitle>
          <Badge variant="outline" className="border-warning text-warning">3 items</Badge>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

    </div>
  );
}
