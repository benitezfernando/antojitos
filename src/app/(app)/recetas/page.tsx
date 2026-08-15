import { apiFetch, APIError } from '@/lib/api-client';
import type { Insumo, Producto } from '@/lib/types';
import RecetaForm from './RecetaForm';
import { ProductoAcciones } from './ProductoActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const dynamic = 'force-dynamic';

function factorConversion(unidadInsumo: string, unidadReceta: string): number {
  const u1 = (unidadInsumo || '').toLowerCase().trim();
  const u2 = (unidadReceta || '').toLowerCase().trim();
  if (u1 === u2) return 1;
  if (u1 === 'kg' && u2 === 'g') return 0.001;
  if (u1 === 'g' && u2 === 'kg') return 1000;
  if (u1 === 'lt' && u2 === 'ml') return 0.001;
  if (u1 === 'ml' && u2 === 'lt') return 1000;
  return 1;
}

export default async function RecetasPage() {
  let insumos: Insumo[] = [];
  let productos: Producto[] = [];
  let errorMsg: string | null = null;

  try {
    [insumos, productos] = await Promise.all([
      apiFetch<Insumo[]>('/insumos'),
      apiFetch<Producto[]>('/productos'),
    ]);
  } catch (error) {
    errorMsg = error instanceof APIError
      ? `Error de API: ${error.message}`
      : 'Error conectando a la base de datos.';
  }

  const insumosMap = new Map(insumos.map(i => [i.id, i]));

  const productosConCapacidad = productos.map(prod => {
    const ings = prod.receta ?? [];
    if (ings.length === 0) return { ...prod, capacidad: null as number | null };
    const rinde = prod.rinde_receta > 0 ? prod.rinde_receta : 1;
    const capacidad = Math.floor(
      Math.min(...ings.map(ing => {
        const ins = insumosMap.get(ing.insumo_id);
        if (!ins || ing.cantidad_necesaria === 0) return 0;
        const qtyInBaseUnit = ing.cantidad_necesaria * factorConversion(ins.unidad_medida, ing.unidad);
        if (qtyInBaseUnit === 0) return 0;
        return (ins.stock_actual * rinde) / qtyInBaseUnit;
      }))
    );
    return { ...prod, capacidad };
  });

  return (
    <div className="page fade-in">

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Recetas y Productos</h1>
          <p className="page-subtitle">Armá tus recetas y calculá costos y precios de venta</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">{productosConCapacidad.length} productos</Badge>
      </div>

      {errorMsg && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid-recetas">

        {/* Catálogo */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de productos</CardTitle>
          </CardHeader>
          <CardContent>
            {productosConCapacidad.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No hay productos. Creá el primero con el formulario.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      <TableHead>Costo/u</TableHead>
                      <TableHead>Precio/u</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="hidden md:table-cell">Rinde · Max.</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosConCapacidad.map((prod, idx) => {
                      const cap = prod.capacidad;
                      const capColor = cap === 0 ? 'var(--destructive)' : cap !== null && cap <= 5 ? 'var(--warning)' : 'var(--success)';
                      return (
                        <ProductoAcciones
                          key={`${prod.id}-${idx}`}
                          id={prod.id}
                          name={prod.nombre}
                          categoria={prod.categoria}
                          margen={prod.margen_ganancia}
                          costo={prod.costo_produccion}
                          precio={prod.precio_venta_sugerido}
                          stock={prod.stock_actual}
                          rinde={prod.rinde_receta}
                          cap={cap}
                          capColor={capColor}
                          recetaIngredientes={(prod.receta ?? []).map(r => ({
                            insumoId: r.insumo_id,
                            cantidad: r.cantidad_necesaria,
                            unidad: r.unidad,
                          }))}
                          insumos={insumos.map(i => ({
                            id: i.id,
                            name: i.nombre,
                            unit: i.unidad_medida,
                            cost: i.costo_unitario,
                          }))}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario nueva receta */}
        <Card className="sticky top-6">
          <CardHeader><CardTitle>Nueva receta</CardTitle></CardHeader>
          <CardContent>
            {insumos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Primero cargá insumos en &quot;Materias Primas&quot;.
              </p>
            ) : (
              <RecetaForm insumos={insumos.map(i => ({ id: i.id, name: i.nombre, unit: i.unidad_medida, cost: i.costo_unitario }))} />
            )}
          </CardContent>
        </Card>

      </div>

      {/* Cards de ingredientes */}
      {productos.some(p => (p.receta ?? []).length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ingredientes por producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {productos.map(prod => {
                const ings = prod.receta ?? [];
                if (ings.length === 0) return null;
                return (
                  <div key={prod.id} className="overflow-hidden rounded-lg border bg-accent/20">
                    <div className="bg-primary px-4 py-2.5">
                      <h3 className="text-sm font-bold text-primary-foreground">{prod.nombre}</h3>
                      <p className="mt-0.5 text-xs text-primary-foreground/80">
                        Rinde {prod.rinde_receta > 1 ? prod.rinde_receta : 1} unidades
                      </p>
                    </div>
                    <ul className="flex flex-col gap-1.5 px-4 py-3">
                      {ings.map((ing, i) => {
                        const ins = insumosMap.get(ing.insumo_id);
                        const qty = Number.isInteger(ing.cantidad_necesaria)
                          ? String(ing.cantidad_necesaria)
                          : ing.cantidad_necesaria.toFixed(3).replace(/\.?0+$/, '');
                        const costo = ins
                          ? ing.cantidad_necesaria * factorConversion(ins.unidad_medida, ing.unidad) * ins.costo_unitario
                          : null;
                        return (
                          <li key={i} className={`flex justify-between py-1.5 text-sm ${i < ings.length - 1 ? 'border-b' : ''}`}>
                            <span className="text-muted-foreground">{ins?.nombre || ing.insumo_id}</span>
                            <span className="text-right">
                              <span className="font-bold">{qty} {ing.unidad || ins?.unidad_medida}</span>
                              {costo !== null && (
                                <span className="block text-xs text-muted-foreground">${costo.toFixed(2)}</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
