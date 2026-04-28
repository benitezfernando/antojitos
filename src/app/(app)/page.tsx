import { apiFetch, APIError } from '@/lib/api-client';
import type { DashboardKPIs, Insumo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let kpis: DashboardKPIs | null = null;
  let insumos: Insumo[] = [];
  let errorMsg: string | null = null;

  try {
    [kpis, insumos] = await Promise.all([
      apiFetch<DashboardKPIs>('/dashboard'),
      apiFetch<Insumo[]>('/insumos'),
    ]);
  } catch (error) {
    errorMsg = error instanceof APIError
      ? `Error de API: ${error.message}`
      : 'Error de conexión. Verificá que el backend esté corriendo.';
  }

  const totalVentasHoy = kpis?.total_ventas_hoy ?? 0;
  const unidadesVendidasHoy = kpis?.unidades_vendidas_hoy ?? 0;
  const productosActivos = kpis?.productos_activos ?? 0;
  const insumosCriticosCount = kpis?.insumos_criticos ?? 0;
  const valorizacionStock = kpis?.valorizacion_stock ?? 0;

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
              <p className="kpi-value">{productosActivos}</p>
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
                      const isCritical = item.stock_actual <= item.stock_minimo;
                      const isLow = !isCritical && item.stock_actual <= item.stock_minimo * 1.5;
                      const badgeClass = isCritical ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-ok';
                      const statusLabel = isCritical ? 'Crítico' : isLow ? 'Bajo' : 'OK';
                      return (
                        <tr key={`${item.id}-${idx}`}>
                          <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                          <td style={{ color: isCritical ? 'var(--danger)' : undefined, fontWeight: isCritical ? 700 : undefined }}>
                            {item.stock_actual} {item.unidad_medida}
                          </td>
                          <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>{item.stock_minimo} {item.unidad_medida}</td>
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
