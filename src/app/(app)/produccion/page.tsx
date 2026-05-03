import { apiFetch, APIError } from '@/lib/api-client';
import type { Producto, RegistroProduccion, Venta } from '@/lib/types';
import ProduccionForm from './ProduccionForm';
import VentaForm from './VentaForm';

export const dynamic = 'force-dynamic';

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default async function ProduccionPage() {
  let productos: Producto[] = [];
  let historialProduccion: RegistroProduccion[] = [];
  let historialVentas: Venta[] = [];
  let errorMsg: string | null = null;

  try {
    [productos, historialProduccion, historialVentas] = await Promise.all([
      apiFetch<Producto[]>('/productos'),
      apiFetch<RegistroProduccion[]>('/produccion'),
      apiFetch<Venta[]>('/ventas'),
    ]);
  } catch (error) {
    errorMsg = error instanceof APIError
      ? `Error de API: ${error.message}`
      : 'Error de conexión.';
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const ventasHoy = historialVentas.filter(v => {
    if (!v.fecha) return false;
    const dia = new Date(v.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    return dia === hoy;
  });
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const unidadesHoy = ventasHoy.reduce((acc, v) => acc + v.cantidad, 0);

  const productosParaForms = productos.map(p => ({
    id: p.id,
    name: p.nombre,
    precio: p.precio_venta_sugerido,
    stock: p.stock_actual,
    capacidad: p.stock_actual,
  }));

  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Producción y Ventas</h1>
          <p className="page-subtitle">Registrá lo que producís y lo que vendés</p>
        </div>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>}

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">Ventas hoy</span>
          <p className="kpi-value" style={{ color: 'var(--primary-dark)' }}>${totalVentasHoy.toFixed(2)}</p>
          <span className="kpi-sub">{unidadesHoy} unidades</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Transacciones hoy</span>
          <p className="kpi-value">{ventasHoy.length}</p>
          <span className="kpi-sub">registros</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Con stock</span>
          <p className="kpi-value">{productos.filter(p => p.stock_actual > 0).length}</p>
          <span className="kpi-sub">productos disponibles</span>
        </div>
      </div>

      {/* Formularios */}
      <div className="grid-2col-equal" style={{ marginBottom: '1.5rem' }}>

        <div className="card">
          <div className="section-header">
            <span className="section-title">Registrar producción</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Descuenta insumos del inventario y suma al stock del producto.
          </p>
          {productosParaForms.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay productos con receta aún.</p>
          ) : (
            <ProduccionForm productos={productosParaForms} />
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">Registrar venta</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Descuenta del stock del producto y registra el ingreso.
          </p>
          {productosParaForms.filter(p => p.stock > 0).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay productos con stock. Registrá producción primero.</p>
          ) : (
            <VentaForm productos={productosParaForms.filter(p => p.stock > 0)} />
          )}
        </div>

      </div>

      {/* Historial */}
      <div className="grid-2col-equal">

        <div className="card">
          <div className="section-header">
            <span className="section-title">Últimas producciones</span>
          </div>
          {historialProduccion.length === 0 ? (
            <p className="empty-state">Sin registros aún.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th className="hide-mobile">Fecha</th></tr>
                </thead>
                <tbody>
                  {historialProduccion.map((reg, i) => (
                    <tr key={reg.id || i}>
                      <td style={{ fontWeight: 600 }}>{reg.nombre_producto}</td>
                      <td>{reg.cantidad}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{formatFecha(reg.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">Últimas ventas</span>
          </div>
          {historialVentas.length === 0 ? (
            <p className="empty-state">Sin registros aún.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th>Total</th><th className="hide-mobile">Fecha</th></tr>
                </thead>
                <tbody>
                  {historialVentas.map((vta, i) => (
                    <tr key={vta.id || i}>
                      <td style={{ fontWeight: 600 }}>{vta.nombre_producto}</td>
                      <td>{vta.cantidad}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>${vta.total.toFixed(2)}</td>
                      <td className="hide-mobile" style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{formatFecha(vta.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
