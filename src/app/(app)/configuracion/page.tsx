export const dynamic = 'force-dynamic';

export default function AcercaDePage() {
  return (
    <div className="fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Acerca de</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Información del sistema</p>
      </header>

      <div className="glass-panel" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
        <h2 style={{ color: 'white', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          🧁 Sobre AntojitosAdmin
        </h2>
        <p style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Sistema de gestión para la pastelería de Anto.</p>
        <p style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Versión 1.0.0 | Next.js 16 + Google Sheets API</p>
        <p style={{ opacity: 0.9 }}>Hosting gratuito en Vercel | Base de datos gratuita en Google Sheets</p>
      </div>
    </div>
  );
}
