import { apiFetch, APIError } from '@/lib/api-client';
import type { Insumo, Producto } from '@/lib/types';
import RecetaForm from './RecetaForm';
import { ProductoAcciones } from './ProductoActions';

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
        <h1 className="page-title">Recetas y Productos</h1>
        <p className="page-subtitle">Armá tus recetas y calculá costos y precios de venta</p>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errorMsg}</div>}

      <div className="grid-recetas">

        {/* Catálogo */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Catálogo de productos</span>
            <span className="badge badge-neutral">{productosConCapacidad.length} productos</span>
          </div>

          {productosConCapacidad.length === 0 ? (
            <p className="empty-state">No hay productos. Creá el primero con el formulario.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="hide-mobile">Categoría</th>
                    <th>Costo/u</th>
                    <th>Precio/u</th>
                    <th>Stock</th>
                    <th className="hide-mobile">Rinde · Max.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productosConCapacidad.map((prod, idx) => {
                    const cap = prod.capacidad;
                    const capColor = cap === 0 ? 'var(--danger)' : cap !== null && cap <= 5 ? 'var(--warning)' : 'var(--success)';
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
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario nueva receta */}
        <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="section-header">
            <span className="section-title">Nueva receta</span>
          </div>
          {insumos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Primero cargá insumos en "Materias Primas".
            </p>
          ) : (
            <RecetaForm insumos={insumos.map(i => ({ id: i.id, name: i.nombre, unit: i.unidad_medida, cost: i.costo_unitario }))} />
          )}
        </div>

      </div>

      {/* Cards de ingredientes */}
      {productos.some(p => (p.receta ?? []).length > 0) && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">Ingredientes por producto</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {productos.map(prod => {
              const ings = prod.receta ?? [];
              if (ings.length === 0) return null;
              return (
                <div key={prod.id} style={{
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  background: 'var(--surface-alt)',
                }}>
                  <div style={{ background: 'var(--primary)', padding: '0.65rem 1rem' }}>
                    <h3 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{prod.nombre}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                      Rinde {prod.rinde_receta > 1 ? prod.rinde_receta : 1} unidades
                    </p>
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0.5rem 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {ings.map((ing, i) => {
                      const ins = insumosMap.get(ing.insumo_id);
                      const qty = Number.isInteger(ing.cantidad_necesaria)
                        ? String(ing.cantidad_necesaria)
                        : ing.cantidad_necesaria.toFixed(3).replace(/\.?0+$/, '');
                      return (
                        <li key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.85rem', padding: '0.3rem 0',
                          borderBottom: i < ings.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>{ins?.nombre || ing.insumo_id}</span>
                          <span style={{ fontWeight: 700 }}>{qty} {ing.unidad || ins?.unidad_medida}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
