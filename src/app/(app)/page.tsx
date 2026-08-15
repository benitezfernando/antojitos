import { apiFetch, APIError } from '@/lib/api-client';
import type { DashboardKPIs, Insumo } from '@/lib/types';
import { KpiTile } from '@/components/KpiTile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Package, TriangleAlert, Banknote } from 'lucide-react';

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
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>

            <KpiTile
              icon={ShoppingCart}
              label="Ventas hoy"
              value={totalVentasHoy}
              prefix="$"
              decimals={2}
              sub={`${unidadesVendidasHoy} unidades vendidas`}
            />

            <KpiTile
              icon={Package}
              label="Productos activos"
              value={productosActivos}
              sub="con receta registrada"
            />

            <KpiTile
              icon={TriangleAlert}
              label="Insumos críticos"
              value={insumosCriticosCount}
              sub={insumosCriticosCount > 0 ? 'requieren reposición' : 'todo en orden'}
              tone={insumosCriticosCount > 0 ? 'destructive' : 'success'}
            />

            <KpiTile
              icon={Banknote}
              label="Stock valorizado"
              value={valorizacionStock}
              prefix="$"
              decimals={0}
              sub="costo directo invertido"
            />

          </div>

          {/* Alertas de insumos */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Alertas de stock</CardTitle>
              {insumosCriticosCount > 0 && (
                <Badge variant="destructive">{insumosCriticosCount} críticos</Badge>
              )}
            </CardHeader>
            <CardContent>
            {insumos.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="8" width="24" height="24" rx="3"/>
                  <path d="M14 20h12M14 14h12M14 26h6"/>
                </svg>
                <p>No hay insumos registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Stock actual</TableHead>
                      <TableHead className="hidden md:table-cell">Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumos.slice(0, 8).map((item, idx) => {
                      const isCritical = item.stock_actual <= item.stock_minimo;
                      const isLow = !isCritical && item.stock_actual <= item.stock_minimo * 1.5;
                      const statusLabel = isCritical ? 'Crítico' : isLow ? 'Bajo' : 'OK';
                      return (
                        <TableRow key={`${item.id}-${idx}`}>
                          <TableCell className="font-semibold">{item.nombre}</TableCell>
                          <TableCell className={isCritical ? 'font-bold text-destructive' : undefined}>
                            {item.stock_actual} {item.unidad_medida}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {item.stock_minimo} {item.unidad_medida}
                          </TableCell>
                          <TableCell>
                            {isCritical ? (
                              <Badge variant="destructive">{statusLabel}</Badge>
                            ) : isLow ? (
                              <Badge variant="outline" className="border-warning text-warning">{statusLabel}</Badge>
                            ) : (
                              <Badge variant="outline" className="border-success text-success">{statusLabel}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
