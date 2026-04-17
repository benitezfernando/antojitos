import { getGoogleSheet } from "@/lib/google-sheets";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let insumos: any[] = [];
  let recetasCount = 0;
  let errorMsg = null;
  let valorizacionStock = 0;
  let insumosCriticosCount = 0;
  let totalVentasHoy = 0;
  let unidadesVendidasHoy = 0;

  try {
    const { doc } = await getGoogleSheet();

    const insumosSheet = doc.sheetsByTitle['Insumos'];
    if (insumosSheet) {
      const rows = await insumosSheet.getRows();
      const seen = new Set<string>();
      insumos = rows
        .map(r => ({
          id: r.get('ID'),
          name: r.get('Nombre'),
          stock: parseFloat(r.get('Stock_Actual')) || 0,
          unit: r.get('Unidad_Medida'),
          minStock: parseFloat(r.get('Stock_Minimo')) || 0,
          costo: parseFloat(r.get('Costo_Unitario')) || 0,
        }))
        .filter(i => {
          if (!i.id || seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        });

      insumosCriticosCount = insumos.filter(i => i.stock <= i.minStock).length;
      valorizacionStock = insumos.reduce((acc, i) => acc + i.stock * i.costo, 0);
    }

    const productosSheet = doc.sheetsByTitle['Productos'];
    if (productosSheet) {
      const pRows = await productosSheet.getRows();
      const seenProds = new Set(pRows.map(r => r.get('ID')).filter(Boolean));
      recetasCount = seenProds.size;
    }

    const ventasSheet = doc.sheetsByTitle['Ventas'];
    if (ventasSheet) {
      // Fecha local Argentina (UTC-3). `Fecha` se guarda en ISO UTC; comparamos por el día
      // según la zona horaria del negocio, no la del servidor.
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
      const vRows = await ventasSheet.getRows();
      const ventasHoy = vRows.filter(r => {
        const fecha = r.get('Fecha') || '';
        if (!fecha) return false;
        const diaVenta = new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        return diaVenta === hoy;
      });
      totalVentasHoy = ventasHoy.reduce((acc, r) => acc + (parseFloat(r.get('Total')) || 0), 0);
      unidadesVendidasHoy = ventasHoy.reduce((acc, r) => acc + (parseFloat(r.get('Cantidad')) || 0), 0);
    }
  } catch (error: any) {
    console.error(error);
    errorMsg = `Error de conexión: ${error.message || 'Verifica tus accesos en Vercel.'}`;
  }

  return (
    <div className="page fade-in">

      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen operativo de Antojitos</p>
      </div>

      {errorMsg ? (
        <div className="alert alert-error">{errorMsg}</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>

            <div className="kpi-card" style={{ '--kpi-color': 'var(--accent)' } as React.CSSProperties}>
              <span className="kpi-label">Ventas hoy</span>
              <p className="kpi-value" style={{ color: 'var(--primary-dark)' }}>${totalVentasHoy.toFixed(2)}</p>
              <span className="kpi-sub">{unidadesVendidasHoy} unidades vendidas</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Productos activos</span>
              <p className="kpi-value">{recetasCount}</p>
              <span className="kpi-sub">con receta registrada</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Insumos críticos</span>
              <p className="kpi-value" style={{ color: insumosCriticosCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {insumosCriticosCount}
              </p>
              <span className="kpi-sub" style={{ color: insumosCriticosCount > 0 ? 'var(--danger)' : undefined }}>
                {insumosCriticosCount > 0 ? 'requieren reposición' : 'todo en orden'}
              </span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Stock valorizado</span>
              <p className="kpi-value">${valorizacionStock.toFixed(0)}</p>
              <span className="kpi-sub">costo directo invertido</span>
            </div>

          </div>

          {/* Alertas de insumos */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Alertas de stock</span>
              {insumosCriticosCount > 0 && (
                <span className="badge badge-danger">{insumosCriticosCount} críticos</span>
              )}
            </div>

            {insumos.length === 0 ? (
              <p className="empty-state">No hay insumos registrados.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Stock actual</th>
                      <th className="hide-mobile">Mínimo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumos.slice(0, 8).map((item, idx) => {
                      const isCritical = item.stock <= item.minStock;
                      const isLow = !isCritical && item.stock <= item.minStock * 1.5;
                      const badgeClass = isCritical ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-ok';
                      const statusLabel = isCritical ? 'Crítico' : isLow ? 'Bajo' : 'OK';
                      return (
                        <tr key={`${item.id}-${idx}`}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td style={{ color: isCritical ? 'var(--danger)' : undefined, fontWeight: isCritical ? 700 : undefined }}>
                            {item.stock} {item.unit}
                          </td>
                          <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>{item.minStock} {item.unit}</td>
                          <td><span className={`badge ${badgeClass}`}>{statusLabel}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
