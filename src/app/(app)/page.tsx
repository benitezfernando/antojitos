import { apiFetch, APIError } from '@/lib/api-client';
import type { DashboardKPIs, Insumo } from '@/lib/types';
import { KpiValue } from '@/components/KpiValue';

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

  const totalVentasHoy       = kpis?.total_ventas_hoy    ?? 0;
  const unidadesVendidasHoy  = kpis?.unidades_vendidas_hoy ?? 0;
  const productosActivos     = kpis?.productos_activos   ?? 0;
  const insumosCriticosCount = kpis?.insumos_criticos    ?? 0;
  const valorizacionStock    = kpis?.valorizacion_stock  ?? 0;

  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen operativo de Antojitos</p>
        </div>
      </div>

      {errorMsg ? (
        <div className="alert alert-error">{errorMsg}</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 1h2l2 6h5l1-4H5"/><circle cx="6" cy="11.5" r="1"/><circle cx="10" cy="11.5" r="1"/>
                </svg>
              </div>
              <span className="kpi-label">Ventas hoy</span>
              <KpiValue value={totalVentasHoy} prefix="$" decimals={2} />
              <span className="kpi-sub">{unidadesVendidasHoy} unidades vendidas</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 1l1.5 3.5L13 5l-3 3 .7 4.2L7 10.5l-3.7 1.7L4 8 1 5l4.5-.5z"/>
                </svg>
              </div>
              <span className="kpi-label">Productos activos</span>
              <KpiValue value={productosActivos} />
              <span className="kpi-sub">con receta registrada</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 1v12M3 5l4-4 4 4M3 9l4 4 4-4"/>
                </svg>
              </div>
              <span className="kpi-label">Insumos críticos</span>
              <KpiValue value={insumosCriticosCount} />
              <span className="kpi-sub" style={{ color: insumosCriticosCount > 0 ? 'var(--rose)' : undefined }}>
                {insumosCriticosCount > 0 ? 'requieren reposición' : 'todo en orden'}
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="12" height="8" rx="1.5"/><path d="M4 4V3a3 3 0 0 1 6 0v1"/>
                </svg>
              </div>
              <span className="kpi-label">Stock valorizado</span>
              <KpiValue value={valorizacionStock} prefix="$" decimals={0} />
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
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="8" width="24" height="24" rx="3"/>
                  <path d="M14 20h12M14 14h12M14 26h6"/>
                </svg>
                <p>No hay insumos registrados.</p>
              </div>
            ) : (
              <div className="table-wrap responsive-cards">
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
                      const rowClass   = isCritical ? 'row-danger' : isLow ? 'row-warning' : 'row-ok';
                      const badgeClass = isCritical ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-ok';
                      const statusLabel = isCritical ? 'Crítico' : isLow ? 'Bajo' : 'OK';
                      return (
                        <tr key={`${item.id}-${idx}`} className={rowClass}>
                          <td data-label="Insumo" style={{ fontWeight: 600 }}>{item.nombre}</td>
                          <td data-label="Stock" style={{ color: isCritical ? 'var(--rose)' : undefined, fontWeight: isCritical ? 700 : undefined }}>
                            {item.stock_actual} {item.unidad_medida}
                          </td>
                          <td data-label="Mínimo" className="hide-mobile" style={{ color: 'var(--text-muted)' }}>
                            {item.stock_minimo} {item.unidad_medida}
                          </td>
                          <td data-label="Estado"><span className={`badge ${badgeClass}`}>{statusLabel}</span></td>
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
