import { apiFetch, APIError } from '@/lib/api-client';
import type { Producto, RegistroProduccion, Venta } from '@/lib/types';
import ProduccionForm from './ProduccionForm';
import VentaForm from './VentaForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

      {errorMsg && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="kpi-label">Ventas hoy</span>
          <p className="kpi-value" style={{ color: 'var(--primary-dark)' }}>${totalVentasHoy.toFixed(2)}</p>
          <span className="kpi-sub">{unidadesHoy} unidades</span>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="kpi-label">Transacciones hoy</span>
          <p className="kpi-value">{ventasHoy.length}</p>
          <span className="kpi-sub">registros</span>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <span className="kpi-label">Con stock</span>
          <p className="kpi-value">{productos.filter(p => p.stock_actual > 0).length}</p>
          <span className="kpi-sub">productos disponibles</span>
        </div>
      </div>

      {/* Formularios */}
      <div className="grid-2col-equal" style={{ marginBottom: '1.5rem' }}>

        <Card>
          <CardHeader>
            <CardTitle>Registrar producción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Descuenta insumos del inventario y suma al stock del producto.
            </p>
            {productosParaForms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos con receta aún.</p>
            ) : (
              <ProduccionForm productos={productosParaForms} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar venta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Descuenta del stock del producto y registra el ingreso.
            </p>
            {productosParaForms.filter(p => p.stock > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos con stock. Registrá producción primero.</p>
            ) : (
              <VentaForm productos={productosParaForms.filter(p => p.stock > 0)} />
            )}
          </CardContent>
        </Card>

      </div>

      {/* Historial */}
      <div className="grid-2col-equal">

        <Card>
          <CardHeader>
            <CardTitle>Últimas producciones</CardTitle>
          </CardHeader>
          <CardContent>
            {historialProduccion.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">Sin registros aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cant.</TableHead>
                      <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialProduccion.map((reg, i) => (
                      <TableRow key={reg.id || i}>
                        <TableCell className="font-semibold">{reg.nombre_producto}</TableCell>
                        <TableCell>{reg.cantidad}</TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatFecha(reg.fecha)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {historialVentas.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">Sin registros aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cant.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialVentas.map((vta, i) => (
                      <TableRow key={vta.id || i}>
                        <TableCell className="font-semibold">{vta.nombre_producto}</TableCell>
                        <TableCell>{vta.cantidad}</TableCell>
                        <TableCell className="font-bold text-primary">${vta.total.toFixed(2)}</TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatFecha(vta.fecha)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
