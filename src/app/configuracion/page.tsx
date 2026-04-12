import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated, logout } from "@/app/auth-actions";

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const auth = await isAuthenticated();
  if (!auth) redirect('/login');

  return (
    <div className="fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Configuración</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Ajustes del sistema y guía de despliegue</p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn" style={{ backgroundColor: 'rgba(229,115,115,0.15)', color: 'var(--danger)', border: '1px solid rgba(229,115,115,0.3)' }}>
            Cerrar sesión
          </button>
        </form>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Acciones rápidas de base de datos */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            Base de Datos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.4)', border: '1px solid var(--glass-border)' }}>
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Inicializar estructura de Google Sheets</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Crea las pestañas si no existen (Insumos, Productos, Recetas, Configuración)</p>
              </div>
              <a href="/api/init-db" target="_blank" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Ejecutar</a>
            </div>
          </div>
        </div>

        {/* Guía de deploy en Vercel */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            🚀 Guía de Hosting Gratuito en Vercel
          </h2>
          <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
            <li>
              <strong style={{ color: 'var(--text-main)' }}>1. Crear cuenta en Vercel</strong><br/>
              Ingresá a <a href="https://vercel.com" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>vercel.com</a> y registrate con tu cuenta de GitHub (gratuito).
            </li>
            <li>
              <strong style={{ color: 'var(--text-main)' }}>2. Subir el código a GitHub</strong><br/>
              Creá un repositorio en github.com, luego ejecutá en la carpeta del proyecto:
              <pre style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', overflowX: 'auto' }}>
{`git init
git add .
git commit -m "Initial Antojitos Admin"
git remote add origin https://github.com/TU_USUARIO/antojitos-admin.git
git push -u origin main`}
              </pre>
            </li>
            <li>
              <strong style={{ color: 'var(--text-main)' }}>3. Importar proyecto en Vercel</strong><br/>
              En vercel.com hacé clic en "Add New Project", seleccioná el repositorio que acabás de subir, y hacé clic en "Deploy".
            </li>
            <li>
              <strong style={{ color: 'var(--text-main)' }}>4. Configurar las Variables de Entorno 🔑</strong><br/>
              Antes de deployar (o en "Settings → Environment Variables" luego), agregá estas 3 variables con los mismos valores que tenés en tu archivo <code>.env.local</code>:
              <pre style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', overflowX: 'auto' }}>
{`GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SPREADSHEET_ID=1koRtoZ21GQzOk7fTPzXk_8kyZYpjzdwbuTQA4fAsbiI`}
              </pre>
              ⚠️ Para la <code>GOOGLE_PRIVATE_KEY</code> pegá todo el texto del JSON incluyendo los saltos de línea <code>\n</code>.
            </li>
            <li>
              <strong style={{ color: 'var(--text-main)' }}>5. ¡Listo! Tu app está online gratis 🎉</strong><br/>
              Vercel te dará una URL tipo <code>https://antojitos-admin.vercel.app</code>. Podés acceder desde cualquier dispositivo, en cualquier lugar.
            </li>
          </ol>
        </div>

        {/* Info general */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
          <h2 style={{ color: 'white', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            🧁 Sobre AntojitosAdmin
          </h2>
          <p style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Sistema de gestión para la pastelería de Anto.</p>
          <p style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Versión 1.0.0 | Next.js 16 + Google Sheets API</p>
          <p style={{ opacity: 0.9 }}>Hosting gratuito en Vercel | Base de datos gratuita en Google Sheets</p>
        </div>

      </div>
    </div>
  );
}
