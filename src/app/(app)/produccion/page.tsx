import { getGoogleSheet } from "@/lib/google-sheets";
import ProduccionForm from "./ProduccionForm";
import VentaForm from "./VentaForm";

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
  let productos: any[] = [];
  let recetas: any[] = [];
  let insumos: any[] = [];
  let historialProduccion: any[] = [];
  let historialVentas: any[] = [];
  let errorMsg = null;

  try {
    const { doc } = await getGoogleSheet();

    const insumosSheet = doc.sheetsByTitle['Insumos'];
    if (insumosSheet) {
      const rows = await insumosSheet.getRows();
      insumos = rows.map(r => ({
        id: r.get('ID'),
        stock: parseFloat(r.get('Stock_Actual')) || 0,
      }));
    }

    const recetasSheet = doc.sheetsByTitle['Recetas'];
    if (recetasSheet) {
      const rows = await recetasSheet.getRows();
      recetas = rows.map(r => ({
        prodId: r.get('ID_Producto'),
        insumoId: r.get('ID_Insumo'),
        cantidad: parseFloat(String(r.get('Cantidad_Necesaria') ?? '0').replace(',', '.')) || 0,
      }));
    }

    const insumosMap = new Map(insumos.map(i => [i.id, i.stock]));

    const productosSheet = doc.sheetsByTitle['Productos'];
    if (productosSheet) {
      const rows = await productosSheet.getRows();
      const seen = new Set<string>();
      const rawProductos = rows
        .map(r => ({
          id: r.get('ID'),
          name: r.get('Nombre'),
          precio: parseFloat(r.get('Precio_Venta_Sugerido')) || 0,
          stock: parseFloat(r.get('Stock_Actual')) || 0,
        }))
        .filter(p => {
          if (!p.id || seen.has(p.id)) return false;
          seen.add(p.id); return true;
        });

      productos = rawProductos.map(prod => {
        const ings = recetas.filter(r => r.prodId === prod.id);
        if (ings.length === 0) return { ...prod, capacidad: 'Sin receta' };
        const capacidad = Math.floor(
          Math.min(...ings.map(ing => {
            const stockIns = insumosMap.get(ing.insumoId) ?? 0;
            if (ing.cantidad === 0) return 0;
            return stockIns / ing.cantidad;
          }))
        );
        return { ...prod, capacidad };
      });
    }

    const produccionSheet = doc.sheetsByTitle['Produccion'];
    if (produccionSheet) {
      const rows = await produccionSheet.getRows();
      historialProduccion = rows
        .map(r => ({
          id: r.get('ID'),
          nombreProducto: r.get('Nombre_Producto'),
          cantidad: parseFloat(r.get('Cantidad')) || 0,
          fecha: r.get('Fecha') || '',
        }))
        .reverse().slice(0, 20);
    }

    const ventasSheet = doc.sheetsByTitle['Ventas'];
    if (ventasSheet) {
      const rows = await ventasSheet.getRows();
      historialVentas = rows
        .map(r => ({
          id: r.get('ID'),
          nombreProducto: r.get('Nombre_Producto'),
          cantidad: parseFloat(r.get('Cantidad')) || 0,
          total: parseFloat(r.get('Total')) || 0,
          fecha: r.get('Fecha') || '',
        }))
        .reverse().slice(0, 20);
    }
  } catch (error: any) {
    errorMsg = `Error de conexión: ${error.message}`;
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const ventasHoy = historialVentas.filter(v => v.fecha.startsWith(hoy));
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const unidadesHoy = ventasHoy.reduce((acc, v) => acc + v.cantidad, 0);

  return (
    <div className="page fade-in">

      <div className="page-header">
        <h1 className="page-title">Producción y Ventas</h1>
        <p className="page-subtitle">Registrá lo que producís y lo que vendés</p>
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
          <p className="kpi-value">{productos.filter(p => p.stock > 0).length}</p>
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
          {productos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay productos con receta aún.</p>
          ) : (
            <ProduccionForm productos={productos} />
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">Registrar venta</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Descuenta del stock del producto y registra el ingreso.
          </p>
          {productos.filter(p => p.stock > 0).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay productos con stock. Registrá producción primero.</p>
          ) : (
            <VentaForm productos={productos.filter(p => p.stock > 0)} />
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
                      <td style={{ fontWeight: 600 }}>{reg.nombreProducto}</td>
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
                      <td style={{ fontWeight: 600 }}>{vta.nombreProducto}</td>
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
